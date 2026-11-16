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
import { BotDifficulty, DIFFICULTY_CONFIG, StockfishService } from './stockfish.service';
import { v4 as uuidv4 } from 'uuid';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/guards/auth.guards';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from '../auth/configs/jwtsecret';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';

const HUMAN_RECONNECT_SECONDS = 30;
const BOT_RECONNECT_SECONDS = 10;

interface GameRoom {
  players: Set<string>;
  white: string | null;
  black: string | null;
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
  drawOfferedBy?: 'White' | 'Black';
}

interface MatchmakingEntry {
  clientId: string;
  userId: string;
}

const DEFAULT_TIME_KEY = '600+0';
const DEFAULT_TIME_MS = 10 * 60 * 1000;
const DEFAULT_INCREMENT_MS = 0;
const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Authoritative board rebuilt from the room's own history; client-sent FEN/PGN is never trusted.
// shortcut: replays the whole PGN on every move, keep a Chess instance on the room if it shows in profiles.
function boardOf(room: GameRoom): Chess {
  const chess = new Chess();
  if (room.pgn && !chess.loadPgn(room.pgn)) chess.load(room.fen);
  return chess;
}

function parseTc(key?: string): { initialMs: number; incrementMs: number } {
  if (!key) return { initialMs: DEFAULT_TIME_MS, incrementMs: DEFAULT_INCREMENT_MS };
  const parts = key.split('+').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) {
    return { initialMs: DEFAULT_TIME_MS, incrementMs: parts[1] * 1_000 };
  }
  return { initialMs: parts[0] * 1_000, incrementMs: parts[1] * 1_000 };
}

function makeEmptyRoom(initialMs: number, incrementMs: number): GameRoom {
  return {
    players: new Set(),
    white: null,
    black: null,
    whiteUserId: null,
    blackUserId: null,
    spectators: new Set(),
    fen: INITIAL_FEN,
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
}

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private activeGames = new Map<string, GameRoom>();
  private activeUsers = new Map<string, string>();
  private matchmakingQueues = new Map<string, MatchmakingEntry>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private userGameSockets = new Map<string, Map<string, string>>();

  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService,
    private readonly stockfishService: StockfishService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token || token === '') {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isBanned: true },
      });
      if (user?.isBanned) {
        client.emit('banned', { message: 'Your account has been banned.' });
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  kickUser(userId: string): void {
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.userId === userId) {
        socket.emit('banned', { message: 'Your account has been banned.' });
        socket.disconnect(true);
      }
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data?.userId;

    if (userId) {
      for (const [gameId, socketMap] of this.userGameSockets) {
        if (socketMap.get(userId) === client.id) socketMap.delete(userId);
        if (socketMap.size === 0) this.userGameSockets.delete(gameId);
      }
    }

    for (const [tcKey, entry] of this.matchmakingQueues.entries()) {
      if (entry.clientId === client.id) {
        this.matchmakingQueues.delete(tcKey);
        break;
      }
    }

    for (const [gameId, gameRoom] of this.activeGames.entries()) {
      if (!gameRoom.players.has(client.id)) continue;

      gameRoom.players.delete(client.id);
      gameRoom.spectators.delete(client.id);

      const isWhite = gameRoom.white === client.id;
      const isBlack = gameRoom.black === client.id;
      const wasPlayer = isWhite || isBlack;

      if (gameRoom.isBot && wasPlayer) {
        const timerKey = `${gameId}:${userId}`;
        if (!this.reconnectTimers.has(timerKey)) {
          this.scheduleBotDisconnectTimeout(gameId, timerKey, true);
        }
        continue;
      }

      if (!wasPlayer || !gameRoom.gameStarted) {
        if (gameRoom.players.size === 0) {
          this.clearGameTimer(gameId);
          this.userGameSockets.delete(gameId);
          this.activeGames.delete(gameId);
        }
        continue;
      }

      const timerKey = `${gameId}:${userId}`;
      if (this.reconnectTimers.has(timerKey)) continue;

      if (gameRoom.moveCount < 1) {
        this.clearGameTimer(gameId);
        this.server.to(`game:${gameId}`).emit('game:over', {
          winner: 'Draw',
          result: 'Game abandoned - opponent left before game began',
        });
        this.notificationService.gameOver(gameId, 'Game abandoned - opponent left before game began');
        this.userGameSockets.delete(gameId);
        this.activeGames.delete(gameId);
        this.prisma.game
          .update({ where: { id: gameId }, data: { status: 'ABANDONED', endedAt: new Date() } })
          .catch(() => {});
        continue;
      }

      this.server.to(`game:${gameId}`).emit('game:opponent-disconnected', {
        reconnectSeconds: HUMAN_RECONNECT_SECONDS,
      });

      const remainingUserId = isWhite ? gameRoom.blackUserId : gameRoom.whiteUserId;
      if (remainingUserId) {
        this.notificationService.opponentDisconnected(remainingUserId, HUMAN_RECONNECT_SECONDS);
      }

      this.scheduleHumanDisconnectTimeout(gameId, timerKey, isWhite);
    }
  }

  private isUserBusy(userId: string): boolean {
    for (const entry of this.matchmakingQueues.values()) {
      if (entry.userId === userId) return true;
    }
    for (const room of this.activeGames.values()) {
      if (room.whiteUserId === userId || room.blackUserId === userId) return true;
    }
    return false;
  }

  getUserActiveGameId(userId: string): string | null {
    for (const [gameId, room] of this.activeGames.entries()) {
      if ((room.whiteUserId === userId || room.blackUserId === userId) && room.gameStarted) {
        return gameId;
      }
    }
    return null;
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (!userId) return;
    this.prisma.user
      .update({ where: { id: userId }, data: { lastSeen: new Date() } })
      .catch((e) => console.warn(`Heartbeat update failed for ${userId}:`, e.message));
    return { success: true };
  }

  @SubscribeMessage('matchmaking:join')
  async handleMatchmakingJoin(
    @MessageBody() data: { timeControlKey: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const tcKey = data.timeControlKey ?? DEFAULT_TIME_KEY;

    if (this.isUserBusy(userId)) {
      client.emit('matchmaking:error', { message: 'You are already in a game or in matchmaking.' });
      return { success: false };
    }

    const waiting = this.matchmakingQueues.get(tcKey);

    if (waiting && waiting.clientId !== client.id) {
      this.matchmakingQueues.delete(tcKey);

      const gameId = uuidv4();
      const { initialMs, incrementMs } = parseTc(tcKey);

      const [whiteEntry, blackEntry] =
        Math.random() < 0.5
          ? [waiting, { clientId: client.id, userId }]
          : [{ clientId: client.id, userId }, waiting];

      const gameRoom = makeEmptyRoom(initialMs, incrementMs);
      gameRoom.whiteUserId = whiteEntry.userId;
      gameRoom.blackUserId = blackEntry.userId;
      this.activeGames.set(gameId, gameRoom);

      this.server.to(whiteEntry.clientId).emit('matchmaking:found', { gameId, role: 'white', timeControlKey: tcKey });
      this.server.to(blackEntry.clientId).emit('matchmaking:found', { gameId, role: 'black', timeControlKey: tcKey });
      this.notificationService.gameCreated(whiteEntry.userId, gameId);
      this.notificationService.gameCreated(blackEntry.userId, gameId);

      try {
        await this.gameService.createGame(whiteEntry.userId, blackEntry.userId, gameId, tcKey);
      } catch (e) {
        console.warn('Could not persist matchmade game:', e.message);
      }
    } else {
      this.matchmakingQueues.set(tcKey, { clientId: client.id, userId });
      client.emit('matchmaking:waiting', { timeControlKey: tcKey });
    }

    return { success: true };
  }

  @SubscribeMessage('matchmaking:cancel')
  handleMatchmakingCancel(@ConnectedSocket() client: Socket) {
    for (const [tcKey, entry] of this.matchmakingQueues.entries()) {
      if (entry.clientId === client.id) {
        this.matchmakingQueues.delete(tcKey);
        break;
      }
    }
    client.emit('matchmaking:cancelled', {});
    return { success: true };
  }

  @SubscribeMessage('game:join')
  async handleJoinGame(
    @MessageBody() data: { gameId: string; timeControlKey?: string; claimedRole?: 'white' | 'black' },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;
    const userId = client.data.userId;
    client.join(roomName);

    if (!this.userGameSockets.has(data.gameId)) {
      this.userGameSockets.set(data.gameId, new Map());
    }
    const gameSocketMap = this.userGameSockets.get(data.gameId)!;
    const prevSocketId = gameSocketMap.get(userId);
    if (prevSocketId && prevSocketId !== client.id) {
      const prevSocket = this.server.sockets.sockets.get(prevSocketId);
      if (prevSocket) {
        prevSocket.emit('game:replace', { reason: 'This game was opened in another tab or device.' });
        prevSocket.leave(roomName);
        prevSocket.disconnect(true);
      }
    }
    gameSocketMap.set(userId, client.id);

    if (!this.activeGames.has(data.gameId)) {
      const dbGame = await this.prisma.game.findUnique({
        where: { id: data.gameId },
        select: { status: true, result: true, winner: true, fen: true, pgn: true, moves: true, whitePlayerId: true, blackPlayerId: true },
      });

      if (!dbGame) {
        client.emit('game:error', { gameId: data.gameId, message: 'This game does not exist.' });
        client.leave(roomName);
        return { success: false, error: 'Game not found' };
      }

      if (dbGame.status === 'COMPLETED' || dbGame.status === 'ABANDONED') {
        client.emit('game:role-assigned', { gameId: data.gameId, role: 'spectator' });
        client.emit('game:state', { gameId: data.gameId, fen: dbGame.fen ?? INITIAL_FEN, pgn: dbGame.pgn ?? '' });
        client.emit('game:over', { winner: dbGame.winner ?? 'Draw', result: dbGame.result ?? 'Game ended' });
        return { success: true, gameId: data.gameId, role: 'spectator' };
      }

      const { initialMs, incrementMs } = parseTc(data.timeControlKey);
      const restored = makeEmptyRoom(initialMs, incrementMs);
      // Moves are checked against the room's board, so a room rebuilt after a restart resumes from the saved position.
      restored.fen = dbGame.fen ?? INITIAL_FEN;
      restored.pgn = typeof dbGame.moves === 'string' ? dbGame.moves : '';
      restored.currentTurn = restored.fen.split(' ')[1] === 'b' ? 'b' : 'w';
      // Seats of a game rebuilt from the DB still belong to its players.
      restored.whiteUserId = dbGame.whitePlayerId;
      restored.blackUserId = dbGame.blackPlayerId;
      this.activeGames.set(data.gameId, restored);
    }

    const gameRoom = this.activeGames.get(data.gameId)!;
    gameRoom.players.add(client.id);

    const timerKey = `${data.gameId}:${userId}`;
    const pendingTimer = this.reconnectTimers.get(timerKey);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.reconnectTimers.delete(timerKey);
      if (gameRoom.whiteUserId === userId) gameRoom.white = client.id;
      if (gameRoom.blackUserId === userId) gameRoom.black = client.id;
      this.server.to(roomName).emit('game:opponent-reconnected', {});
      this.emitPlayerNames(data.gameId, roomName, gameRoom);
      const otherUserId = gameRoom.whiteUserId === userId ? gameRoom.blackUserId : gameRoom.whiteUserId;
      if (otherUserId) this.notificationService.opponentReconnected(otherUserId);
    }

    let assignedRole: 'white' | 'black' | 'spectator';

    // A seat is free only when no user owns it. The socket alone says nothing: a matchmade game reserves
    // both seats before either player has connected, and a bot's seat never has a socket.
    const whiteFree = gameRoom.whiteUserId === null && !gameRoom.isBot;
    const blackFree = gameRoom.blackUserId === null && !gameRoom.isBot;

    if (gameRoom.whiteUserId === userId) {
      assignedRole = 'white';
      gameRoom.white = client.id;
    } else if (gameRoom.blackUserId === userId) {
      assignedRole = 'black';
      gameRoom.black = client.id;
    } else if (data.claimedRole === 'white' && whiteFree) {
      assignedRole = 'white';
      gameRoom.white = client.id;
      gameRoom.whiteUserId = userId;
    } else if (data.claimedRole === 'black' && blackFree) {
      assignedRole = 'black';
      gameRoom.black = client.id;
      gameRoom.blackUserId = userId;
    } else if (gameRoom.gameStarted) {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    } else if (whiteFree && blackFree) {
      assignedRole = Math.random() < 0.5 ? 'white' : 'black';
      if (assignedRole === 'white') {
        gameRoom.white = client.id;
        gameRoom.whiteUserId = userId;
      } else {
        gameRoom.black = client.id;
        gameRoom.blackUserId = userId;
      }
    } else if (whiteFree) {
      assignedRole = 'white';
      gameRoom.white = client.id;
      gameRoom.whiteUserId = userId;
    } else if (blackFree) {
      assignedRole = 'black';
      gameRoom.black = client.id;
      gameRoom.blackUserId = userId;
    } else {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    }

    if (assignedRole !== 'spectator' && !gameRoom.gameStarted) {
      const whiteReady = gameRoom.white !== null && gameRoom.players.has(gameRoom.white);
      const blackReady = gameRoom.black !== null && gameRoom.players.has(gameRoom.black);
      if (whiteReady && blackReady) {
        gameRoom.gameStarted = true;
        this.startGameTimer(data.gameId, gameRoom);
        this.emitPlayerNames(data.gameId, roomName, gameRoom);
        if (gameRoom.whiteUserId && gameRoom.blackUserId) {
          this.gameService
            .createGame(gameRoom.whiteUserId, gameRoom.blackUserId, data.gameId, data.timeControlKey ?? DEFAULT_TIME_KEY)
            .catch((e) => console.warn('Could not persist direct-join game to DB:', e.message));
        }
      }
    }

    client.emit('game:role-assigned', { gameId: data.gameId, role: assignedRole });
    client.to(roomName).emit('game:player-joined', {
      gameId: data.gameId,
      playersCount: gameRoom.players.size,
      whiteConnected: gameRoom.white !== null,
      blackConnected: gameRoom.black !== null,
      spectatorCount: gameRoom.spectators.size,
    });
    client.emit('game:state', { gameId: data.gameId, fen: gameRoom.fen, pgn: gameRoom.pgn });
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
    @MessageBody() data: { gameId: string; difficulty: BotDifficulty; timeControlKey?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // A bot game always starts a fresh room: never replace someone else's running game.
    if (this.activeGames.has(data.gameId)) {
      return { success: false, error: 'Game already exists' };
    }

    const userId = client.data.userId;
    const roomName = `game:${data.gameId}`;
    client.join(roomName);

    if (!this.userGameSockets.has(data.gameId)) {
      this.userGameSockets.set(data.gameId, new Map());
    }
    const gameSocketMap = this.userGameSockets.get(data.gameId)!;
    const prevSocketId = gameSocketMap.get(userId);
    if (prevSocketId && prevSocketId !== client.id) {
      const prevSocket = this.server.sockets.sockets.get(prevSocketId);
      if (prevSocket) {
        prevSocket.emit('game:replaced', { reason: 'This game was opened in another tab or device.' });
        prevSocket.leave(roomName);
        prevSocket.disconnect(true);
      }
    }
    gameSocketMap.set(userId, client.id);

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
      fen: INITIAL_FEN,
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
      DIFFICULTY_CONFIG[data.difficulty].skillLevel,
      data.timeControlKey ?? DEFAULT_TIME_KEY,
      data.gameId,
    );

    client.emit('game:role-assigned', { gameId: data.gameId, role: humanColor });

    this.userService.findById(userId).then((user) => {
      const humanName = user?.username ?? 'Player';
      const difficulty = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);
      const botName = `Stockfish (${difficulty})`;
      client.emit('game:players', {
        gameId: data.gameId,
        white: { userId: humanColor === 'white' ? userId : null, username: humanColor === 'white' ? humanName : botName },
        black: { userId: humanColor === 'black' ? userId : null, username: humanColor === 'black' ? humanName : botName },
      });
    });

    client.emit('game:state', { gameId: data.gameId, fen: gameRoom.fen, pgn: gameRoom.pgn });
    this.startGameTimer(data.gameId, gameRoom);

    if (botColor === 'w') {
      this.scheduleBotMove(data.gameId, gameRoom);
    }

    return { success: true, role: humanColor };
  }

  @SubscribeMessage('game:leave')
  handleLeaveGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId: string | undefined = client.data?.userId;
    client.leave(`game:${data.gameId}`);

    if (userId) {
      const socketMap = this.userGameSockets.get(data.gameId);
      if (socketMap?.get(userId) === client.id) {
        socketMap.delete(userId);
        if (socketMap.size === 0) this.userGameSockets.delete(data.gameId);
      }
    }

    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return { success: true };

    gameRoom.players.delete(client.id);
    gameRoom.spectators.delete(client.id);

    const isWhite = gameRoom.white === client.id;
    const isBlack = gameRoom.black === client.id;
    const wasPlayer = isWhite || isBlack;

    if (!wasPlayer) return { success: true };

    if (!gameRoom.gameStarted) {
      if (isWhite) { gameRoom.white = null; gameRoom.whiteUserId = null; }
      if (isBlack) { gameRoom.black = null; gameRoom.blackUserId = null; }
      if (gameRoom.players.size === 0) {
        this.clearGameTimer(data.gameId);
        if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);
        this.userGameSockets.delete(data.gameId);
        this.activeGames.delete(data.gameId);
      } else {
        this.server.to(`game:${data.gameId}`).emit('game:opponent-left', {
          gameId: data.gameId,
          message: 'Opponent left before the game started.',
        });
      }
      return { success: true };
    }

    if (gameRoom.isBot) {
      const timerKey = `${data.gameId}:${userId}`;
      if (!this.reconnectTimers.has(timerKey)) {
        this.scheduleBotDisconnectTimeout(data.gameId, timerKey, false);
      }
      return { success: true };
    }

    if (gameRoom.moveCount === 0) {
      this.clearGameTimer(data.gameId);
      this.userGameSockets.delete(data.gameId);
      this.activeGames.delete(data.gameId);
      this.server.to(`game:${data.gameId}`).emit('game:over', { winner: 'Draw', result: 'Game abandoned' });
      this.gameService.persistGameResult(data.gameId, 'Draw', 'Game abandoned', true).catch(() => {});
      return { success: true };
    }

    const timerKey = `${data.gameId}:${userId}`;
    if (this.reconnectTimers.has(timerKey)) return { success: true };

    const remainingUserId = isWhite ? gameRoom.blackUserId : gameRoom.whiteUserId;
    if (remainingUserId) {
      this.notificationService.opponentDisconnected(remainingUserId, HUMAN_RECONNECT_SECONDS);
    }
    this.server.to(`game:${data.gameId}`).emit('game:opponent-disconnected', {
      reconnectSeconds: HUMAN_RECONNECT_SECONDS,
    });
    this.scheduleHumanDisconnectTimeout(data.gameId, timerKey, isWhite);

    return { success: true };
  }

  @SubscribeMessage('game:move')
  async handleMove(
    @MessageBody() data: { gameId: string; move: any; fen: string; pgn: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;

    try {
      if (!data.gameId || !data.move) {
        throw new WsException('Invalid move data');
      }

      const gameRoom = this.activeGames.get(data.gameId);
      if (!gameRoom || !gameRoom.players.has(client.id)) {
        throw new WsException('You are not in this game');
      }
      if (gameRoom.white !== client.id && gameRoom.black !== client.id) {
        throw new WsException('Spectators cannot make moves');
      }

      // Apply the move on the server's board: data.fen / data.pgn are ignored on purpose,
      // the FEN ends up on Stockfish's stdin and in every other client.
      const chess = boardOf(gameRoom);
      if (chess.turn() !== (gameRoom.white === client.id ? 'w' : 'b')) {
        throw new WsException('Not your turn');
      }
      const { from, to, promotion } = data.move;
      const moveResult =
        typeof from === 'string' && typeof to === 'string' && (promotion == null || typeof promotion === 'string')
          ? chess.move({ from, to, promotion: promotion ?? undefined })
          : null;
      if (!moveResult) {
        throw new WsException('Illegal move');
      }
      const fen = chess.fen();
      const pgn = chess.pgn();

      client.to(roomName).emit('game:move', { move: moveResult, fen, pgn });

      gameRoom.fen = fen;
      gameRoom.pgn = pgn;
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

      this.gameService
        .updateGame(data.gameId, { fen, moves: pgn })
        .catch((err) => console.warn('Failed to save game state to DB (non-fatal):', err.message));

      if (gameRoom.isBot && gameRoom.currentTurn === gameRoom.botColor) {
        this.scheduleBotMove(data.gameId, gameRoom);
      }

      return { success: true };
    } catch (error) {
      client.emit('error', { message: error.message ?? 'failed to process move' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('game:over')
  async handleGameOver(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom || !this.playerColor(gameRoom, client)) return { success: false };

    // The client only signals that the game ended: winner and reason come from the server's board.
    const chess = new Chess();
    if (!gameRoom.pgn || !chess.loadPgn(gameRoom.pgn)) chess.load(gameRoom.fen);

    let winner: string;
    let result: string;
    if (chess.isCheckmate()) {
      winner = chess.turn() === 'w' ? 'Black' : 'White';
      result = 'Checkmate';
    } else if (chess.isStalemate()) {
      winner = 'Draw';
      result = 'Stalemate';
    } else if (chess.isDraw()) {
      winner = 'Draw';
      result = 'Draw';
    } else {
      return { success: false };
    }

    gameRoom.timerRunning = false;
    this.clearGameTimer(data.gameId);
    if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);

    this.server.to(`game:${data.gameId}`).emit('game:over', { winner, result });
    this.notificationService.gameOver(data.gameId, result, winner === 'Draw' ? undefined : winner);

    await this.gameService.persistGameResult(data.gameId, winner, result, false, gameRoom);
    this.userGameSockets.delete(data.gameId);
    this.activeGames.delete(data.gameId);

    return { success: true };
  }

  @SubscribeMessage('game:resign')
  async handleResign(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return { success: false };

    const resigningColor = this.playerColor(gameRoom, client);
    if (!resigningColor) return { success: false };
    const winner = resigningColor === 'White' ? 'Black' : 'White';
    const resultStr = `${resigningColor} resigned - ${winner} wins`;

    gameRoom.timerRunning = false;
    this.clearGameTimer(data.gameId);
    if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);

    this.server.to(`game:${data.gameId}`).emit('game:over', { winner, result: resultStr });
    this.notificationService.gameOver(data.gameId, resultStr, winner);

    await this.gameService.persistGameResult(data.gameId, winner, resultStr, false, gameRoom);
    this.userGameSockets.delete(data.gameId);
    this.activeGames.delete(data.gameId);

    return { success: true };
  }

  @SubscribeMessage('game:draw-offer')
  handleDrawOffer(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return { success: false };

    const offerer = this.playerColor(gameRoom, client);
    if (!offerer) return { success: false };
    gameRoom.drawOfferedBy = offerer;

    client.to(`game:${data.gameId}`).emit('game:draw-offered', { gameId: data.gameId });

    const opponentUserId = offerer === 'White' ? gameRoom.blackUserId : gameRoom.whiteUserId;
    if (opponentUserId) this.notificationService.drawOffered(opponentUserId);

    return { success: true };
  }

  @SubscribeMessage('game:draw-response')
  async handleDrawResponse(
    @MessageBody() data: { gameId: string; accepted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (!gameRoom) return { success: false };

    // Only the opponent of whoever offered the draw may answer it.
    const responder = this.playerColor(gameRoom, client);
    if (!responder || !gameRoom.drawOfferedBy || gameRoom.drawOfferedBy === responder) {
      return { success: false };
    }
    gameRoom.drawOfferedBy = undefined;

    if (data.accepted) {
      const resultStr = 'Draw by agreement';
      gameRoom.timerRunning = false;
      this.clearGameTimer(data.gameId);
      if (gameRoom.isBot) this.stockfishService.stopEngine(data.gameId);

      this.server.to(`game:${data.gameId}`).emit('game:over', { winner: 'Draw', result: resultStr });
      this.notificationService.gameOver(data.gameId, resultStr);

      await this.gameService.persistGameResult(data.gameId, 'Draw', resultStr, false, gameRoom);
      this.userGameSockets.delete(data.gameId);
      this.activeGames.delete(data.gameId);
    } else {
      client.to(`game:${data.gameId}`).emit('game:draw-declined', { gameId: data.gameId });

      const offererUserId = responder === 'White' ? gameRoom.blackUserId : gameRoom.whiteUserId;
      if (offererUserId) this.notificationService.drawDeclined(offererUserId);
    }

    return { success: true };
  }

  @SubscribeMessage('spectator:join')
  handleSpectateJoin(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`game:${data.gameId}`);
    this.server.to(`game:${data.gameId}`).emit('spectate:count', {
      gameId: data.gameId,
      count: this.activeGames.get(data.gameId)?.spectators.size ?? 0,
    });
    return { success: true };
  }

  @SubscribeMessage('user:get-online')
  handleGetOnlineUsers() {
    return { users: Array.from(this.activeUsers.keys()) };
  }

  @SubscribeMessage('game:load')
  async handleLoadGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = await this.gameService.getGame(data.gameId);
      client.emit('game:loaded', { gameId: game.id, fen: game.fen, pgn: game.moves, status: game.status });
      return { success: true };
    } catch {
      throw new WsException('Game not found');
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private playerColor(room: GameRoom, client: Socket): 'White' | 'Black' | null {
    if (room.white === client.id) return 'White';
    if (room.black === client.id) return 'Black';
    return null;
  }

  private getActiveTime(gameRoom: GameRoom, color: 'w' | 'b'): number {
    if (!gameRoom.timerRunning || !gameRoom.lastMoveAt) {
      return color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs;
    }
    const stored = color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs;
    if (gameRoom.currentTurn === color) {
      return Math.max(0, stored - (Date.now() - gameRoom.lastMoveAt));
    }
    return stored;
  }

  private startGameTimer(gameId: string, gameRoom: GameRoom) {
    gameRoom.timerRunning = true;
    gameRoom.gameStartedAt = Date.now();
    gameRoom.lastMoveAt = Date.now();

    this.server.to(`game:${gameId}`).emit('game:timer', {
      whiteTimeMs: gameRoom.whiteTimeMs,
      blackTimeMs: gameRoom.blackTimeMs,
      currentTurn: gameRoom.currentTurn,
      timerRunning: true,
      incrementMs: gameRoom.incrementMs,
    });

    gameRoom.timerInterval = setInterval(() => {
      if (!gameRoom.timerRunning) return;

      const activeTime = this.getActiveTime(gameRoom, gameRoom.currentTurn as 'w' | 'b');
      if (activeTime > 0) return;

      const winner = gameRoom.currentTurn === 'w' ? 'Black' : 'White';
      const loser = gameRoom.currentTurn === 'b' ? 'White' : 'Black';
      const result = `${loser} ran out of time - ${winner} wins`;

      gameRoom.timerRunning = false;
      if (gameRoom.currentTurn === 'w') gameRoom.whiteTimeMs = 0;
      else gameRoom.blackTimeMs = 0;

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

      this.gameService.persistGameResult(gameId, winner, result, false, gameRoom);
      this.userGameSockets.delete(gameId);
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

  private async emitPlayerNames(gameId: string, roomName: string, gameRoom: GameRoom): Promise<void> {
    try {
      const [whiteUser, blackUser] = await Promise.all([
        gameRoom.whiteUserId ? this.userService.findById(gameRoom.whiteUserId) : null,
        gameRoom.blackUserId ? this.userService.findById(gameRoom.blackUserId) : null,
      ]);
      this.server.to(roomName).emit('game:players', {
        gameId,
        white: { userId: gameRoom.whiteUserId, username: whiteUser?.username ?? 'Unknown' },
        black: { userId: gameRoom.blackUserId, username: blackUser?.username ?? 'Unknown' },
      });
    } catch (e) {
      console.warn('Could not emit player names:', e.message);
    }
  }

  private scheduleHumanDisconnectTimeout(gameId: string, timerKey: string, isWhite: boolean): void {
    const timerId = setTimeout(async () => {
      this.reconnectTimers.delete(timerKey);
      if (!this.activeGames.has(gameId)) return;

      const winner = isWhite ? 'Black' : 'White';
      const resultStr = `${isWhite ? 'White' : 'Black'} disconnected - ${winner} wins`;

      this.clearGameTimer(gameId);
      const room = this.activeGames.get(gameId);
      this.userGameSockets.delete(gameId);
      this.activeGames.delete(gameId);

      this.server.to(`game:${gameId}`).emit('game:over', { winner, result: resultStr });
      this.notificationService.gameOver(gameId, resultStr, winner);
      await this.gameService
        .persistGameResult(gameId, winner, resultStr, true, room ?? undefined)
        .catch((e) => console.warn(`Failed to persist abandoned game ${gameId}:`, e.message));
    }, HUMAN_RECONNECT_SECONDS * 1000);

    this.reconnectTimers.set(timerKey, timerId);
  }

  private scheduleBotDisconnectTimeout(gameId: string, timerKey: string, abandoned: boolean): void {
    const timerId = setTimeout(async () => {
      this.reconnectTimers.delete(timerKey);
      const room = this.activeGames.get(gameId);
      if (!room) return;

      const humanSocket = room.botColor === 'b' ? room.white : room.black;
      if (humanSocket && room.players.has(humanSocket)) return;

      const winner = abandoned ? 'Draw' : (room.botColor === 'b' ? 'Black' : 'White');
      const resultStr = abandoned ? 'Player abandoned' : `Player disconnected - ${winner} wins`;

      this.clearGameTimer(gameId);
      this.stockfishService.stopEngine(gameId);
      this.userGameSockets.delete(gameId);
      this.activeGames.delete(gameId);

      this.server.to(`game:${gameId}`).emit('game:over', { winner, result: resultStr });
      this.notificationService.gameOver(gameId, resultStr);
      await this.gameService.persistGameResult(gameId, winner, resultStr, true, room).catch(() => {});
    }, BOT_RECONNECT_SECONDS * 1000);

    this.reconnectTimers.set(timerKey, timerId);
  }

  private scheduleBotMove(gameId: string, gameRoom: GameRoom): void {
    setImmediate(async () => {
      try {
        const fenBeforeMove = gameRoom.fen;
        const uciMove = await this.stockfishService.getBestMove(gameId, gameRoom.fen);
        const parsed = this.stockfishService.parseUciMove(uciMove);

        const chess = boardOf(gameRoom); // keeps the full PGN, a FEN-only board would drop the history
        const moveResult = chess.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion });

        if (!moveResult) {
          console.error(`Bot move ${uciMove} was illegal in position ${fenBeforeMove}`);
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

        this.server.to(`game:${gameId}`).emit('game:move', { move: parsed, fen: newFen, pgn: newPgn });
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
}
