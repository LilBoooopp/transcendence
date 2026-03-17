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
import { EloService } from '../elo/elo.service';
import { NotificationService } from '../notification/notification.service';

type BotDifficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_TO_INT: Record<BotDifficulty, number> = {
  easy: 1,
  medium: 10,
  hard: 20,
};

const HUMAN_RECONNECT_SECONDS = 30;
const BOT_RECONNECT_SECONDS = 10;

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
  gameStartedAt: number | null;
  moveCount: number;
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

  /**
   * Keyed by "<gameId>:<userId>"
   * Stores pending setTimeout handles so reconnects can cancel them
   */
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService,
    private readonly stockfishService: StockfishService,
    private readonly jwtService: JwtService,
    private readonly eloService: EloService,
    private readonly notificationService: NotificationService,
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

  /**
   * Handles socket drop for any reason
   *
   * ranked:
   * moveCount === 0 -> game never really began, ABANDONED
   * moveCount >= 1 -> real game; start 30-second reconnect window
   *  if reconnected within window -> timer cancelled
   *  if timeout expires -> opponent wins
   *
   * bot:
   * 10 second timout
   */
  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data?.userId;
    console.log(`Client disconnected: ${client.id}`);

    // remove from matchmaking
    for (const [tcKey, entry] of this.matchmakingQueues.entries()) {
      if (entry.clientId === client.id) {
        this.matchmakingQueues.delete(tcKey);
        break;
      }
    }

    if (userId) {
      this.prisma.user
        .update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        })
        .catch((e) => console.warn(`Failed to mark user ${userId} offline:`, e.message));
    }

    // Remove from active games
    for (const [gameId, gameRoom] of this.activeGames.entries()) {
      if (!gameRoom.players.has(client.id)) continue;

      gameRoom.players.delete(client.id);
      gameRoom.spectators.delete(client.id);

      const isWhite = gameRoom.white === client.id;
      const isBlack = gameRoom.black === client.id;
      const wasPlayer = isWhite || isBlack;


      if (gameRoom.isBot) {
        const timerKey = `${gameId}:${userId}`;
        if (this.reconnectTimers.has(timerKey)) return; // already waiting

        const timerId = setTimeout(async () => {
          this.reconnectTimers.delete(timerKey);
          const room = this.activeGames.get(gameId);
          if (!room || room.players.size > 0) return;

          this.clearGameTimer(gameId);
          this.stockfishService.stopEngine(gameId);
          this.activeGames.delete(gameId);

          await this.persistGameResult(gameId, 'Draw', 'Player abandoned', true).catch(() => { });
          console.log(`Bot game ${gameId} marked ABANDONED after reconnect timeout`);
        }, BOT_RECONNECT_SECONDS * 1000);

        this.reconnectTimers.set(timerKey, timerId);
        continue;
      }

      if (!wasPlayer || !gameRoom.gameStarted) {
        if (gameRoom.players.size === 0) {
          this.clearGameTimer(gameId);
          this.activeGames.delete(gameId);
        }
        continue;
      }

      const timerKey = `${gameId}:${userId}`;
      if (this.reconnectTimers.has(timerKey)) continue;

      if (gameRoom.moveCount < 1) {
        console.log(`Game ${gameId}: player disconnected before first move - ending game as abandoned and notifying room`);
        this.clearGameTimer(gameId);

        this.server.to(`game:${gameId}`).emit('game:over', {
          winner: 'Draw',
          result: 'Game abandoned - opponent left before game began',
        });

        this.notificationService.gameOver(
          gameId,
          'Game abandoned - opponent left before game began',
        );

        this.activeGames.delete(gameId);

        this.prisma.game
          .update({ where: { id: gameId }, data: { status: 'ABANDONED', endedAt: new Date() } })
          .catch(() => { });
        continue;
      }

      console.log(`Game ${gameId}: ${userId} disconnected - starting ${HUMAN_RECONNECT_SECONDS}s reconnect window`);

      this.server.to(`game:${gameId}`).emit('game:opponent-disconnected', {
        reconnectSeconds: HUMAN_RECONNECT_SECONDS,
      });

      // notification
      const remainingUserId = isWhite
        ? gameRoom.blackUserId
        : gameRoom.whiteUserId;
      if (remainingUserId) {
        this.notificationService.opponentDisconnected(
          remainingUserId,
          HUMAN_RECONNECT_SECONDS,
        );
      }

      const timerId = setTimeout(async () => {
        this.reconnectTimers.delete(timerKey);
        const room = this.activeGames.get(gameId);
        if (!room) return;

        const winner = isWhite ? 'Black' : 'White';
        const resultStr = `${isWhite ? 'White' : 'Black'} disconnected - ${winner} wins`;

        this.clearGameTimer(gameId);
        this.activeGames.delete(gameId);

        this.server.to(`game:${gameId}`).emit('game:over', { winner, result: resultStr });
        console.log(`Game ${gameId}: reconnect window expired - ${resultStr}`);

        this.notificationService.gameOver(gameId, resultStr, winner);

        await this.persistGameResult(gameId, winner, resultStr, true).catch((e) =>
          console.warn(`Failed to persist abandoned game ${gameId}:`, e.message),
        );
      }, HUMAN_RECONNECT_SECONDS * 1000);

      this.reconnectTimers.set(timerKey, timerId);
    }
  }

  /**
   * Check if a user is already in a matchmaking queue or in an active game.
   */
  private isUserBusy(userId: string): boolean {
    // Check all matchmaking queues
    for (const entry of this.matchmakingQueues.values()) {
      if (entry.userId === userId) return true;
    }
    // Check all active games (as a player, not spectator)
    for (const room of this.activeGames.values()) {
      if (room.whiteUserId === userId || room.blackUserId === userId) return true;
    }
    return false;
  }

  @SubscribeMessage('matchmaking:join')
  async handleMatchmakingJoin(
    @MessageBody() data: { timeControlKey: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const tcKey = data.timeControlKey ?? DEFAULT_TIME_KEY;

    // Prevent duplicate matchmaking / playing
    if (this.isUserBusy(userId)) {
      client.emit('matchmaking:error', {
        message: 'You are already in a game or in matchmaking.',
      });
      console.log(`Matchmaking [${tcKey}]: ${client.id} (${userId}) rejected - already busy`);
      return { success: false };
    }

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
        gameStartedAt: null,
        moveCount: 0,
      };

      this.activeGames.set(gameId, gameRoom);

      // notify players of game
      this.server.to(whiteEntry.clientId).emit('matchmaking:found', { gameId, role: 'white', timeControlKey: tcKey });
      this.server.to(blackEntry.clientId).emit('matchmaking:found', { gameId, role: 'black', timeControlKey: tcKey });

      this.notificationService.gameCreated(whiteEntry.userId, gameId);
      this.notificationService.gameCreated(blackEntry.userId, gameId);

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
  async handleJoinGame(
    @MessageBody() data: { gameId: string; timeControlKey?: string, claimedRole?: 'white' | 'black' },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;
    const userId = client.data.userId;
    client.join(roomName);

    if (!this.activeGames.has(data.gameId)) {
      const dbGame = await this.prisma.game.findUnique({
        where: { id: data.gameId },
        select: { status: true, result: true, winner: true, fen: true, pgn: true },
      });

      if (!dbGame) {
        client.emit('game:error', {
          gameId: data.gameId,
          message: 'This game does not exist.',
        });
        client.leave(roomName);
        return { success: false, error: 'Game not found' };
      }

      if (dbGame.status === 'COMPLETED' || dbGame.status === 'ABANDONED') {
        client.emit('game:role-assigned', {
          gameId: data.gameId,
          role: 'spectator',
        });
        client.emit('game:state', {
          gameId: data.gameId,
          fen: dbGame.fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          pgn: dbGame.pgn ?? '',
        });
        client.emit('game:over', {
          winner: dbGame.winner ?? 'Draw',
          result: dbGame.result ?? 'Game ended',
        });
        return ({ success: true, gameId: data.gameId, role: 'spectator' });
      }

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
        gameStartedAt: null,
        moveCount: 0,
      });
    }

    const gameRoom = this.activeGames.get(data.gameId);
    gameRoom.players.add(client.id);

    const timerKey = `${data.gameId}:${userId}`;
    const pendingTimer = this.reconnectTimers.get(timerKey);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.reconnectTimers.delete(timerKey);
      console.log(`Game ${data.gameId}: ${userId} reconnected - timer cancelled`);
      if (gameRoom.whiteUserId === userId) gameRoom.white = client.id;
      if (gameRoom.blackUserId === userId) gameRoom.black = client.id;

      this.server.to(roomName).emit('game:opponent-reconnected', {});

      // notification
      const otherUserId = gameRoom.whiteUserId === userId
        ? gameRoom.blackUserId
        : gameRoom.whiteUserId;
      if (otherUserId) {
        this.notificationService.opponentReconnected(otherUserId);
      }
    }

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
      gameRoom.black = client.id;
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
      gameStartedAt: null,
      moveCount: 0,
    };

    this.activeGames.set(data.gameId, gameRoom);

    await this.stockfishService.startEngine(data.gameId, data.difficulty);

    await this.gameService.createBotGame(
      userId,
      humanColor,
      data.difficulty,
      DIFFICULTY_TO_INT[data.difficulty],
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
      gameRoom.moveCount += 1;

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

    this.notificationService.gameOver(data.gameId, data.result, data.winner);

    await this.persistGameResult(data.gameId, data.winner, data.result);
    this.activeGames.delete(data.gameId);

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

    this.notificationService.gameOver(data.gameId, resultStr, winner);

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

    // notifications
    const gameRoomDraw = this.activeGames.get(data.gameId);
    if (gameRoomDraw) {
      const offererIsWhite = gameRoomDraw.white === client.id;
      const opponentUserId = offererIsWhite
        ? gameRoomDraw.blackUserId
        : gameRoomDraw.whiteUserId;
      if (opponentUserId) {
        this.notificationService.drawOffered(opponentUserId, client.data.username);
      }
    }

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

      this.notificationService.gameOver(data.gameId, resultStr);

      await this.persistGameResult(data.gameId, 'Draw', resultStr);
    } else {
      client.to(`game:${data.gameId}`).emit('game:draw-declined', {
        gameId: data.gameId,
      });

      const drawRoom = this.activeGames.get(data.gameId);
      if (drawRoom) {
        const declinerIsWhite = drawRoom.white === client.id;
        const offererUserId = declinerIsWhite
          ? drawRoom.blackUserId
          : drawRoom.whiteUserId;
        if (offererUserId) {
          this.notificationService.drawDeclined(offererUserId);
        }
      }
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
    gameRoom.gameStartedAt = Date.now();
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

      this.notificationService.gameOver(gameId, result, winner);

      this.server.to(`game:${gameId}`).emit('game:timer', {
        whiteTimeMs: gameRoom.whiteTimeMs,
        blackTimeMs: gameRoom.blackTimeMs,
        currentTurn: gameRoom.currentTurn,
        timerRunning: false,
        incrementMs: gameRoom.incrementMs,
      });

      this.persistGameResult(gameId, winner, result);
      this.activeGames.delete(gameId);
    }, 1000);
  }

  private clearGameTimer(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (gameRoom?.timerInterval) {
      clearInterval(gameRoom.timerInterval);
      gameRoom.timerInterval = null;
    }
  }

  /**
   * Centralised endofgame persistence
   *
   * @param abandoned true when the game ended because a player disconnected.
   */
  private async persistGameResult(
    gameId: string,
    winner: string,
    result: string,
    abandoned = false,
  ): Promise<void> {
    const gameRoom = this.activeGames.get(gameId);
    const endedAt = new Date();

    try {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        select: {
          whitePlayerId: true,
          blackPlayerId: true,
          timeControl: true,
          isRanked: true,
          isAiGame: true,
          startedAt: true,
        },
      });

      const startMs =
        gameRoom?.gameStartedAt ??
        (game?.startedAt ? game.startedAt.getTime() : null);
      const playTimeSeconds = startMs
        ? Math.max(0, Math.floor((endedAt.getTime() - startMs) / 1000))
        : 0;

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: abandoned ? 'ABANDONED' : 'COMPLETED',
          result: toDbResult(winner),
          winner: winner.toLowerCase(),
          endedAt,
          fen: gameRoom?.fen ?? undefined,
          pgn: gameRoom?.pgn ?? undefined,
          moves: gameRoom?.pgn ?? undefined,
          totalMoves: gameRoom ? Math.ceil(gameRoom.moveCount / 2) : undefined,
        },
      });

      const whiteId = gameRoom?.whiteUserId ?? game?.whitePlayerId ?? null;
      const blackId = gameRoom?.blackUserId ?? game?.blackPlayerId ?? null;
      const w = winner.toLowerCase();

      if (whiteId) {
        const outcome: 'win' | 'draw' | 'loss' =
          w === 'white' ? 'win' : w === 'draw' ? 'draw' : 'loss';
        await this.updatePlayerStats(whiteId, outcome, playTimeSeconds);
      }

      if (blackId) {
        const outcome: 'win' | 'draw' | 'loss' =
          w === 'black' ? 'win' : w === 'draw' ? 'draw' : 'loss';
        await this.updatePlayerStats(blackId, outcome, playTimeSeconds);
      }

      if (!abandoned && game?.isRanked && !game?.isAiGame && whiteId && blackId) {
        await this.eloService.processGameResult(
          gameId,
          game.timeControl,
          whiteId,
          blackId,
          winner,
        );
      }
    } catch (e) {
      console.warn(`Failed to persist result for game ${gameId} (non-fatal):`, e.message);
    }
  }

  /**
  * updates UserStatistics for one player after game ends.
  * does not touch ELO (done in EloServic)
  */
  private async updatePlayerStats(
    userId: string,
    outcome: 'win' | 'draw' | 'loss',
    playTimeSeconds: number,
  ): Promise<void> {
    const stats = await this.prisma.userStatistics.upsert({
      where: { userId },
      create: { userId, bulletElo: 1200, blitzElo: 1200, rapidElo: 1200 },
      update: {},
    });

    const newStreak = outcome === 'win' ? stats.currentStreak + 1 : 0;
    const newBestStreak = Math.max(stats.bestStreak, newStreak);

    await this.prisma.userStatistics.update({
      where: { userId },
      data: {
        totalGames: { increment: 1 },
        wins: outcome === 'win' ? { increment: 1 } : undefined,
        losses: outcome === 'loss' ? { increment: 1 } : undefined,
        draws: outcome === 'draw' ? { increment: 1 } : undefined,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        totalPlayTime: { increment: playTimeSeconds },
      },
    });
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
        gameRoom.moveCount += 1;

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
