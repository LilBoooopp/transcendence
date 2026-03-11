import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { PrismaService } from '../prisma/prisma.service';
import { Chess } from '../chess/src/Chess';
import { StockfishService } from './stockfish.service';
import { PieceSymbol } from '../chess/src/types';
import { v4 as uuidv4 } from 'uuid';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/guards/auth.guards';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from '../auth/configs/jwtsecret';

type BotDifficulty = 'easy' | 'medium' | 'hard';

interface GameRoom {
  players: Set<string>;
  white: string | null; // just socket
  black: string | null; // socket
  whiteUserId: string | null;
  blackUserId: string | null;
  spectators: Set<string>;
  fen: string;
  pgn: string;
  gameStarted: boolean;
  whiteTimeMs: number;
  blackTimeMs: number;
  incrementMs: number;
  currentTurn: string;
  lastMoveAt: number | null;
  timerRunning: boolean;
  timerInterval: ReturnType<typeof setInterval> | null;
  isBot: boolean;
  botColor: 'w' | 'b' | null;
  botDifficulty: BotDifficulty | null;
}

interface MatchmakingEntry {
  clientId: string;
  userId: string;
}

const DEFAULT_TIME_KEY = '600+0';
const DEFAULT_TIME_MS = 10 * 60 * 1000;
const DEFAULT_INCREMENT_MS = 0;

function parseTc(key?: string): { initialMs: number; incrementMs: number } {
  if (!key) return ({ initialMs: DEFAULT_TIME_MS, incrementMs: DEFAULT_INCREMENT_MS });
  const parts = (key ?? '').split('+').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) {
    return ({ initialMs: DEFAULT_TIME_MS, incrementMs: parts[1] * 1_000 });
  }
  return ({ initialMs: parts[0] * 1_000, incrementMs: parts[1] * 1_000 });
}

function toDbResult(winner: string): 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' {
  if (winner === 'White') return ('WHITE_WIN');
  if (winner === 'Black') return ('BLACK_WIN');
  return ('DRAW');
}

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;


  //Store games
  private activeGames = new Map<string, GameRoom>();
  // Store connectionsa
  private activeUsers = new Map<string, string>();

  /**
  * Matchmaking queues based on time control (eg. "600+0")
  * Each queue holds at most one player at a time,
  * second player joins means they are paired.
  */
  private matchmakingQueues = new Map<string, MatchmakingEntry>();

  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService,
    private readonly stockfishService: StockfishService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token || token === '') {
      console.log(`Rejected: no token provided by ${client.id}`);
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET });
      client.data.userId = payload.sub;
      client.data.username = payload.username;
      console.log(`Client connected: ${client.id} (user: ${client.data.username})`);
    } catch (err) {
      console.log(`Rejected invalid token from ${client.id}: ${err.message}`);
      console.log(`Token received: ${token?.slice(0, 20)}...`);
      client.disconnect();
    }
  }

  //disconnections
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // remove from matchmaking
    for (const [tcKey, entry] of this.matchmakingQueues.entries()) {
      if (entry.clientId === client.id) {
        this.matchmakingQueues.delete(tcKey);
        break;
      }
    }

    // Remove from active games
    for (const [gameId, gameRoom] of this.activeGames.entries()) {
      if (gameRoom.players.has(client.id)) {
        gameRoom.players.delete(client.id);
        gameRoom.spectators.delete(client.id);

        if (!gameRoom.gameStarted) {
          if (gameRoom.white === client.id) gameRoom.white = null;
          if (gameRoom.black === client.id) gameRoom.black = null;
        }

        if (gameRoom.players.size === 0) {
          this.clearGameTimer(gameId);
          if (gameRoom.isBot) {
            setTimeout(() => {
              const room = this.activeGames.get(gameId);
              if (room && room.players.size === 0) {
                this.clearGameTimer(gameId);
                this.stockfishService.stopEngine(gameId);
                this.activeGames.delete(gameId);
                console.log(`Bot game ${gameId} cleaned up after reconect timeout`);
              }
            }, 10_000)
          } else {
            this.clearGameTimer(gameId);
            this.activeGames.delete(gameId);
          }
        }
      }
    }
  }

  @SubscribeMessage('matchmaking:join')
  async handleMatchmakingJoin(
    @MessageBody() data: { timeControlKey: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const tcKey = data.timeControlKey ?? DEFAULT_TIME_KEY;
    const waiting = this.matchmakingQueues.get(tcKey);

    if (waiting && waiting.clientId !== client.id) {
      // match found
      this.matchmakingQueues.delete(tcKey);

      const gameId = uuidv4();
      const { initialMs, incrementMs } = parseTc(tcKey);

      // assign colors
      const [whiteEntry, blackEntry] =
        Math.random() < 0.5
          ? [waiting, { clientId: client.id, userId: userId }]
          : [{ clientId: client.id, userId: userId }, waiting];

      const gameRoom: GameRoom = {
        players: new Set(),
        white: null,
        black: null,
        whiteUserId: whiteEntry.userId,
        blackUserId: blackEntry.userId,
        spectators: new Set(),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        gameStarted: false,
        whiteTimeMs: initialMs,
        blackTimeMs: initialMs,
        incrementMs,
        currentTurn: 'w',
        lastMoveAt: null,
        timerRunning: false,
        timerInterval: null,
        isBot: false,
        botColor: null,
        botDifficulty: null,
      };

      this.activeGames.set(gameId, gameRoom);

      // notify players of game
      this.server.to(whiteEntry.clientId).emit('matchmaking:found', { gameId, role: 'white', timeControlKey: tcKey });
      this.server.to(blackEntry.clientId).emit('matchmaking:found', { gameId, role: 'black', timeControlKey: tcKey });

      console.log(`Matchmaking [${tcKey}]: paired ${whiteEntry.clientId} (W) vs ${blackEntry.clientId} (B) -> game ${gameId}`);

      try {
        await this.gameService.createGame(whiteEntry.userId, blackEntry.userId, gameId, tcKey);
      } catch (e) {
        console.warn('Could not persist matchmade game:', e.message);
      }
    } else {
      this.matchmakingQueues.set(tcKey, { clientId: client.id, userId: userId });
      client.emit('matchmaking:waiting', { timeControlKey: tcKey });
      console.log(`Matchmaking [${tcKey}]: ${client.id} is waiting`);
    }

    return ({ success: true });
  }

  @SubscribeMessage('matchmaking:cancel')
  handleMatchmakingCancel(@ConnectedSocket() client: Socket) {
    for (const [tcKey, entry] of this.matchmakingQueues.entries()) {
      if (entry.clientId == client.id) {
        this.matchmakingQueues.delete(tcKey);
        console.log(`Matchmaking: ${client.id} cancelled`);
        break;
      }
    }
    client.emit('matchmaking:cancelled', {});
    return ({ success: true });
  }

  // Join a room$
  //@UseGuards(WsAuthGuard)
  @SubscribeMessage('game:join')
  handleJoinGame(
    @MessageBody() data: { gameId: string; timeControlKey?: string, claimedRole?: 'white' | 'black' },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;
    const userId = client.data.userId;
    client.join(roomName);

    if (!this.activeGames.has(data.gameId)) {
      const { initialMs, incrementMs } = parseTc(data.timeControlKey);
      this.activeGames.set(data.gameId, {
        players: new Set(),
        white: null,
        black: null,
        whiteUserId: null,
        blackUserId: null,
        spectators: new Set(),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        gameStarted: false,
        whiteTimeMs: initialMs,
        blackTimeMs: initialMs,
        incrementMs,
        currentTurn: 'w',
        lastMoveAt: null,
        timerRunning: false,
        timerInterval: null,
        isBot: false,
        botColor: null,
        botDifficulty: null,
      });
    }

    const gameRoom = this.activeGames.get(data.gameId);
    gameRoom.players.add(client.id);

    let assignedRole: 'white' | 'black' | 'spectator';

    if (gameRoom.whiteUserId === userId) {
      assignedRole = 'white';
      gameRoom.white = client.id;
    } else if (gameRoom.blackUserId === userId) {
      assignedRole = 'black';
      gameRoom.black = client.id;
    } else if (data.claimedRole === 'white' && gameRoom.white === null) {
      assignedRole = 'white';
      gameRoom.white = client.id;
      gameRoom.whiteUserId = userId;
    } else if (data.claimedRole === 'black' && gameRoom.black === null) {
      assignedRole = 'black';
      gameRoom.white = client.id;
      gameRoom.blackUserId = userId;
    } else if (gameRoom.gameStarted) {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    } else if (gameRoom.white === null && gameRoom.black === null) {
      assignedRole = Math.random() < 0.5 ? 'white' : 'black';
      if (assignedRole === 'white') {
        gameRoom.white = client.id;
        gameRoom.whiteUserId = userId;
      } else {
        gameRoom.black = client.id;
        gameRoom.blackUserId = userId;
      }
    } else if (gameRoom.white === null) {
      assignedRole = 'white'
      gameRoom.white = client.id;
      gameRoom.whiteUserId = userId;
    } else if (gameRoom.black === null) {
      assignedRole = 'black';
      gameRoom.black = client.id;
      gameRoom.blackUserId = userId;
    } else {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    }

    console.log(`Client ${client.id} joined game ${data.gameId} as ${assignedRole}`);

    if (assignedRole !== 'spectator' && !gameRoom.gameStarted) {
      const whiteReady = gameRoom.white !== null && gameRoom.players.has(gameRoom.white);
      const blackReady = gameRoom.black !== null && gameRoom.players.has(gameRoom.black);
      if (whiteReady && blackReady) {
        gameRoom.gameStarted = true;
        this.startGameTimer(data.gameId, gameRoom);

        if (gameRoom.whiteUserId && gameRoom.blackUserId) {
          this.gameService.createGame(
            gameRoom.whiteUserId,
            gameRoom.blackUserId,
            data.gameId,
            data.timeControlKey ?? DEFAULT_TIME_KEY,
          ).catch((e) => {
            console.warn('Could not persist direct-join game to DB:', e.message);
          })
        }
      }
    }

    // tell the client what role they got
    client.emit('game:role-assigned', {
      gameId: data.gameId,
      role: assignedRole,
    });

    // Notify others in the game
    client.to(roomName).emit('game:player-joined', {
      gameId: data.gameId,
      playersCount: gameRoom.players.size,
      whiteConnected: gameRoom.white !== null,
      blackConnected: gameRoom.black !== null,
      spectatorCount: gameRoom.spectators.size,
    });

    client.emit('game:state', {
      gameId: data.gameId,
      fen: gameRoom.fen,
      pgn: gameRoom.pgn,
    });

    client.emit('game:timer', {
      whiteTimeMs: this.getActiveTime(gameRoom, 'w'),
      blackTimeMs: this.getActiveTime(gameRoom, 'b'),
      currentTurn: gameRoom.currentTurn,
      timerRunning: gameRoom.timerRunning,
      incrementMs: gameRoom.incrementMs,
    });

    return { success: true, gameId: data.gameId, role: assignedRole };
  }

  @SubscribeMessage('game:bot-join')
  async handleBotJoin(
    @MessageBody() data: { gameId: string; difficulty: BotDifficulty, timeControlKey?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const roomName = `game:${data.gameId}`;
    client.join(roomName);

    const { initialMs, incrementMs } = parseTc(data.timeControlKey);


    const humanColor: 'white' | 'black' = Math.random() < 0.5 ? 'white' : 'black';
    const botColor: 'w' | 'b' = humanColor === 'white' ? 'b' : 'w';

    const gameRoom: GameRoom = {
      players: new Set([client.id]),
      white: humanColor === 'white' ? client.id : null,
      black: humanColor === 'black' ? client.id : null,
      whiteUserId: humanColor === 'white' ? userId : null,
      blackUserId: humanColor === 'black' ? userId : null,
      spectators: new Set(),
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      gameStarted: true,
      whiteTimeMs: initialMs,
      blackTimeMs: initialMs,
      incrementMs,
      currentTurn: 'w',
      lastMoveAt: null,
      timerRunning: false,
      timerInterval: null,
      isBot: true,
      botColor,
      botDifficulty: data.difficulty,
    };

    this.activeGames.set(data.gameId, gameRoom);

    await this.stockfishService.startEngine(data.gameId, data.difficulty);

    await this.gameService.createBotGame(
      userId,
      humanColor,
      data.difficulty,
      data.timeControlKey ?? DEFAULT_TIME_KEY,
      data.gameId,
    );

    client.emit('game:role-assigned', {
      gameId: data.gameId,
      role: humanColor,
    });

    client.emit('game:state', {
      gameId: data.gameId,
      fen: gameRoom.fen,
      pgn: gameRoom.pgn,
    });

    this.startGameTimer(data.gameId, gameRoom);

    if (botColor === 'w') {
      this.scheduleBotMove(data.gameId, gameRoom);
    }

    return { success: true, role: humanColor };
  }

  // Leave a game
  @SubscribeMessage('game:leave')
  handleLeaveGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`game:${data.gameId}`);

    const gameRoom = this.activeGames.get(data.gameId);
    if (gameRoom) {
      gameRoom.players.delete(client.id);
      gameRoom.spectators.delete(client.id);

      if (!gameRoom.gameStarted) {
        if (gameRoom.white === client.id) { gameRoom.white = null; gameRoom.whiteUserId = null; }
        if (gameRoom.black === client.id) { gameRoom.black = null; gameRoom.blackUserId = null; }
      }

      if (gameRoom.players.size === 0) {
        this.clearGameTimer(data.gameId);
        if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);
        this.activeGames.delete(data.gameId);
      }
    }

    return { success: true };
  }

  @SubscribeMessage('game:move')
  async handleMove(
    @MessageBody() data: { gameId: string; move: any; fen: string; pgn: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;

    console.log(`MOVE RECEIVED from client ${client.id}`);
    console.log(`Game: ${data.gameId}`);
    console.log(`Move:`, data.move);

    try {
      if (!data.gameId || !data.move || !data.fen) {
        throw new WsException('Invalid move data');
      }

      const gameRoom = this.activeGames.get(data.gameId);
      if (!gameRoom || !gameRoom.players.has(client.id)) {
        throw new WsException('You are not in this game');
      }

      if (gameRoom.white !== client.id && gameRoom.black !== client.id) {
        throw new WsException('Spectators cannot make moves');
      }

      console.log(`Broadcasting 'game:move' event to room...`);
      client.to(roomName).emit('game:move', {
        move: data.move,
        fen: data.fen,
        pgn: data.pgn,
      });

      gameRoom.fen = data.fen;
      gameRoom.pgn = data.pgn;

      const movedColor = gameRoom.currentTurn;
      gameRoom.currentTurn = gameRoom.currentTurn === 'w' ? 'b' : 'w';

      if (gameRoom.timerRunning && gameRoom.lastMoveAt !== null) {
        const elapsed = Date.now() - gameRoom.lastMoveAt;
        if (movedColor === 'w') {
          gameRoom.whiteTimeMs = Math.max(0, gameRoom.whiteTimeMs - elapsed + gameRoom.incrementMs);
        } else {
          gameRoom.blackTimeMs = Math.max(0, gameRoom.blackTimeMs - elapsed + gameRoom.incrementMs);
        }

        gameRoom.lastMoveAt = Date.now();

        this.server.to(roomName).emit('game:timer', {
          whiteTimeMs: gameRoom.whiteTimeMs,
          blackTimeMs: gameRoom.blackTimeMs,
          currentTurn: gameRoom.currentTurn,
          timerRunning: true,
          incrementMs: gameRoom.incrementMs,
        });
      }
      console.log(`Move in game ${data.gameId}:`, data.move);

      this.gameService.updateGame(data.gameId, { fen: data.fen, moves: data.pgn })
        .catch((err) => console.warn('Failed to save game state to DB (non-fatal):', err.message));

      if (gameRoom.isBot && gameRoom.currentTurn === gameRoom.botColor) {
        this.scheduleBotMove(data.gameId, gameRoom);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling move:', error);
      client.emit('error', { message: error.message ?? 'failed to process move' });
      return { success: false, error: error.message };
    }
  }


  @SubscribeMessage('game:over')
  async handleGameOver(
    @MessageBody() data: { gameId: string; winner: string; result: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (gameRoom) {
      gameRoom.timerRunning = false;
      this.clearGameTimer(data.gameId);
      if (gameRoom.isBot) {
        this.stockfishService.stopEngine(data.gameId);
      }
    }

    // Broadcast gameover to all players
    this.server.to(`game:${data.gameId}`).emit('game:over', {
      winner: data.winner,
      result: data.result,
    });

    await this.persistGameResult(data.gameId, data.winner, data.result);

    return { success: true };
  }

  @SubscribeMessage('game:resign')
  async handleResign(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return ({ success: false });

    const resigningColor = gameRoom.white === client.id ? 'White' : 'Black';
    const winner = resigningColor === 'White' ? 'Black' : 'White';
    const resultStr = `${resigningColor} resigned - ${winner} wins`;

    gameRoom.timerRunning = false;
    this.clearGameTimer(data.gameId);
    if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);

    this.server.to(`game:${data.gameId}`).emit('game:over', {
      winner,
      result: resultStr,
    });

    await this.persistGameResult(data.gameId, winner, resultStr);

    return ({ success: true });
  }

  @SubscribeMessage('game:draw-offer')
  handleDrawOffer(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return ({ success: false });

    // forward only to opponent
    client.to(`game:${data.gameId}`).emit('game:draw-offered', {
      gameId: data.gameId,
    });

    return ({ success: true });
  }

  @SubscribeMessage('game:draw-response')
  async handleDrawResponse(
    @MessageBody() data: { gameId: string; accepted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return ({ success: false });

    if (data.accepted) {
      const resultStr = 'Draw by agreement';
      gameRoom.timerRunning = false;
      this.clearGameTimer(data.gameId);
      if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);

      this.server.to(`game:${data.gameId}`).emit('game:over', {
        winner: 'Draw',
        result: resultStr,
      });

      await this.persistGameResult(data.gameId, 'Draw', resultStr);
    } else {
      client.to(`game:${data.gameId}`).emit('game:draw-declined', {
        gameId: data.gameId,
      });
    }

    return ({ success: true });
  }

  // Message
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @MessageBody() data: { gameId?: string; message: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    const payload = { userId, message: data.message, timestamp: new Date() };

    if (data.gameId) {
      client.to(`game:${data.gameId}`).emit('chat:message', payload);
    } else {
      this.server.emit('chat:message', payload);
    }
    return { success: true };
  }

  // Spectator join game

  @SubscribeMessage('spectator:join')
  handleSpectateJoin(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`game:${data.gameId}`);

    // Notify players that spectator count increased
    this.server.to(`game:${data.gameId}`).emit('spectate:count', {
      gameId: data.gameId,
      count: this.activeGames.get(data.gameId)?.spectators.size ?? 0,
    });

    return { success: true };
  }

  // Get online users
  @SubscribeMessage('user:get-online')
  handleGetOnlineUsers() {
    return {
      users: Array.from(this.activeUsers.keys()),
    };
  }

  @SubscribeMessage('game:load')
  async handleLoadGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = await this.gameService.getGame(data.gameId);

      client.emit('game:loaded', {
        gameId: game.id,
        fen: game.fen,
        pgn: game.moves,
        status: game.status,
      });

      return { success: true };
    } catch (error) {
      console.log('Error loading game:', error);
      throw new WsException('Game not found');
    }
  }

  // helper functinos
  private getActiveTime(gameRoom: any, color: 'w' | 'b'): number {
    if (!gameRoom.timerRunning || !gameRoom.lastMoveAt) {
      return (color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs);
    }
    const stored = color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs;
    if (gameRoom.currentTurn === color) {
      return (Math.max(0, stored - (Date.now() - gameRoom.lastMoveAt)));
    }
    return (stored);
  }

  private startGameTimer(gameId: string, gameRoom: any) {
    gameRoom.timerRunning = true;
    gameRoom.lastMoveAt = Date.now();
    const inc = gameRoom.incrementMs;

    console.log(`Game ${gameId} started - timers running (${gameRoom.whiteTimeMs / 1000}s + ${inc / 1000}s increment`);

    this.server.to(`game:${gameId}`).emit('game:timer', {
      whiteTimeMs: gameRoom.whiteTimeMs,
      blackTimeMs: gameRoom.blackTimeMs,
      currentTurn: gameRoom.currentTurn,
      timerRunning: true,
      incrementMs: inc,
    });

    gameRoom.timerInterval = setInterval(() => {
      if (!gameRoom.timerRunning) return;

      const activeTime = this.getActiveTime(gameRoom, gameRoom.currentTurn as 'w' | 'b');
      if (activeTime > 0) return;

      const winner = gameRoom.currentTurn === 'w' ? 'Black' : 'White';
      const loser = gameRoom.currentTurn === 'b' ? 'White' : 'Black';
      const result = `${loser} ran out of time - ${winner} wins`;

      console.log(`Game ${gameId}: ${result}`);

      gameRoom.timerRunning = false;
      if (gameRoom.currentTurn === 'w') {
        gameRoom.whiteTimeMs = 0;
      } else {
        gameRoom.blackTimeMs = 0;
      }

      clearInterval(gameRoom.timerInterval);
      gameRoom.timerInterval = null;

      this.server.to(`game:${gameId}`).emit('game:over', { winner, result });

      this.server.to(`game:${gameId}`).emit('game:timer', {
        whiteTimeMs: gameRoom.whiteTimeMs,
        blackTimeMs: gameRoom.blackTimeMs,
        currentTurn: gameRoom.currentTurn,
        timerRunning: false,
        incrementMs: gameRoom.incrementMs,
      });

      this.persistGameResult(gameId, winner, result);
    }, 1000);
  }

  private clearGameTimer(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (gameRoom?.timerInterval) {
      clearInterval(gameRoom.timerInterval);
      gameRoom.timerInterval = null;
    }
  }

  private async persistGameResult(gameId: string, winner: string, result: string) {
    try {
      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'COMPLETED',
          result: toDbResult(winner),
          winner: winner.toLowerCase(),
          endedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn(`Failed to persist result for game ${gameId} (non-fatal):`, e.message);
    }
  }

  private scheduleBotMove(gameId: string, gameRoom: GameRoom): void {
    setImmediate(async () => {
      try {
        const fenBeforeMove = gameRoom.fen;
        const uciMove = await this.stockfishService.getBestMove(gameId, gameRoom.fen);
        const parsed = this.parseUciMove(uciMove);

        const chess = new Chess(fenBeforeMove);
        const moveResult = chess.move({
          from: parsed.from,
          to: parsed.to,
          promotion: parsed.promotion,
        });

        if (!moveResult) {
          console.error(`Bot move ${uciMove} was illegal in postion ${fenBeforeMove}`);
          return;
        }

        const newFen = chess.fen();
        const newPgn = chess.pgn();

        gameRoom.fen = newFen;
        gameRoom.pgn = newPgn;

        const movedColor = gameRoom.currentTurn as 'w' | 'b';
        gameRoom.currentTurn = movedColor === 'w' ? 'b' : 'w';

        if (gameRoom.timerRunning && gameRoom.lastMoveAt !== null) {
          const elapsed = Date.now() - gameRoom.lastMoveAt;
          if (movedColor === 'w') {
            gameRoom.whiteTimeMs = Math.max(0, gameRoom.whiteTimeMs - elapsed + gameRoom.incrementMs);
          } else {
            gameRoom.blackTimeMs = Math.max(0, gameRoom.blackTimeMs - elapsed + gameRoom.incrementMs);
          }
          gameRoom.lastMoveAt = Date.now();
        }

        this.server.to(`game:${gameId}`).emit('game:move', {
          move: parsed,
          fen: newFen,
          pgn: newPgn,
        });

        this.server.to(`game:${gameId}`).emit('game:timer', {
          whiteTimeMs: gameRoom.whiteTimeMs,
          blackTimeMs: gameRoom.blackTimeMs,
          currentTurn: gameRoom.currentTurn,
          timerRunning: gameRoom.timerRunning,
          incrementMs: gameRoom.incrementMs,
        });
      } catch (err) {
        console.error(`Bot move failed for game ${gameId}:`, err.message);
      }
    });
  }

  private parseUciMove(uci: string): { from: string, to: string; promotion?: PieceSymbol } {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] as PieceSymbol : undefined;
    return (promotion ? { from, to, promotion } : { from, to });
  }

}
