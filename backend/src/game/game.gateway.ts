import { WsException } from '@nestjs/websockets'; 
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', // need to specify URL
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store connectionsa
  private activeUsers = new Map<string, string>();

  //Store games
  private activeGames = new Map<string, {
    players: Set<string>; // All socket IDs
    white: string | null; // white players socket ID
    black: string | null; // black plaeyrs socket ID
    spectators: Set<string>; // spectator socket ID // spectator socket ID
    fen: string;
    pgn: string;
    gameStarted: boolean;
    whiteTimeMs: number;
    blackTimeMs: number;
    currentTurn: 'w' | 'b';
    lastMoveAt: number | null;
    timerRunning: boolean;
    timerInterval: ReturnType<typeof setInterval> | null;
  }>();

  private readonly DEFAULT_TIME_MS = 10 * 60 * 1000;

  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService,
  ) {}

  //new connection
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  //disconnections
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove from active user
    for (const [userId, socketId] of this.activeUsers.entries()) {
      if (socketId === client.id) {
        this.activeUsers.delete(userId);
        // Broadcast user offline
        this.server.emit('user:status', { userId, isOnline: false});
        break;
      }
    }

    // Remove from active games
    for (const [gameId, gameRoom] of this.activeGames.entries()) {
      if (gameRoom.players.has(client.id)) {
        gameRoom.players.delete(client.id);
        gameRoom.spectators.delete(client.id);

        if (!gameRoom.gameStarted) {
          if (gameRoom.white === client.id) {
            gameRoom.white = null;
          }
          if (gameRoom.black === client.id) {
            gameRoom.black = null;
          }
        }

        if (gameRoom.players.size === 0) {
          this.activeGames.delete(gameId);
        }
      }
    }
  }

  // User authentication/identificaition
  @SubscribeMessage('user:identify')
  handleUserIdentify(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.activeUsers.set(data.userId, client.id);

    // braodcast user online
    this.server.emit('user:status', { userId: data.userId, isOnline: true });

    return { success: true, userId: data.userId };
  }

  // Join a room
  @SubscribeMessage('game:join')
  handleJoinGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `game:${data.gameId}`;
    client.join(roomName);

    if (!this.activeGames.has(data.gameId)) {
      this.activeGames.set(data.gameId, {
        players: new Set(),
        white: null,
        black: null,
        spectators: new Set(),
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        gameStarted: false,
        whiteTimeMs: this.DEFAULT_TIME_MS,
        blackTimeMs: this.DEFAULT_TIME_MS,
        currentTurn: 'w',
        lastMoveAt: null,
        timerRunning: false,
        timerInterval: null,
      });
    }

    const gameRoom = this.activeGames.get(data.gameId);
    gameRoom.players.add(client.id);

    let assignedRole: 'white' | 'black' | 'spectator';

    if (gameRoom.gameStarted) {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    }

    if (gameRoom.white === null && gameRoom.black === null) {
      assignedRole = Math.random() < 0.5 ? 'white' : 'black';
      if (assignedRole === 'white') {
        gameRoom.white = client.id;
      } else {
        gameRoom.black = client.id;
      }
    } else if (gameRoom.white === null) {
      assignedRole = 'white'
      gameRoom.white = client.id;
      gameRoom.gameStarted = true;
      this.startGameTimer(data.gameId, gameRoom);
    } else if (gameRoom.black === null) {
      assignedRole = 'black';
      gameRoom.black = client.id;
      gameRoom.gameStarted = true;
      this.startGameTimer(data.gameId, gameRoom);
    } else {
      assignedRole = 'spectator';
      gameRoom.spectators.add(client.id);
    }

    console.log(`Client ${client.id} joined game ${data.gameId} as ${assignedRole}`);

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
    });

    return { success: true, gameId: data.gameId, role: assignedRole };
  }

  private getActiveTime(gameRoom: any, color: 'w' | 'b'): number {
    if (!gameRoom.timerRunning || !gameRoom.lastMoveAt) {
      return (color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs);
    }
    const stored = color === 'w' ? gameRoom.whiteTimeMs : gameRoom.blackTimeMs;
    if (gameRoom.currentTurn === color) {
      const elapsed = Date.now() - gameRoom.lastMoveAt;
      return (Math.max(0, stored - elapsed));
    }
    return (stored);
  }

  private startGameTimer(gameId: string, gameRoom: any) {
    gameRoom.timerRunning = true;
    gameRoom.lastMoveAt = Date.now();

    console.log(`Game ${gameId} started - timers running (${this.DEFAULT_TIME_MS / 1000}s per player)`);

    this.server.to(`game:${gameId}`).emit('game:timer', {
      whiteTimeMs: gameRoom.whiteTimeMs,
      blackTimeMs: gameRoom.blackTimeMs,
      currentTurn: gameRoom.currentTurn,
      timerRunning: true,
    });

    gameRoom.timerInterval = setInterval(() => {
      if (!gameRoom.timerRunning) return;
      
      const activeTime = this.getActiveTime(gameRoom, gameRoom.currentTurn);

      if (activeTime <= 0) {
        const winner = gameRoom.currentTurn === 'w' ? 'Black' : 'White';
        const loser = gameRoom.currentTurn === 'b' ? 'White' : 'Black';

        console.log(`Game ${gameId}: ${loser} ran out of time - ${winner} wins`);

        gameRoom.timerRunning = false;
        if (gameRoom.currentTurn === 'w') {
          gameRoom.whiteTimeMs = 0;
        } else {
          gameRoom.blackTimeMs = 0;
        }


        this.server.to(`game:${gameId}`).emit('game:over', {
          winner: winner,
          result: `${loser} ran out of time - ${winner} wins`,
        });

        this.server.to(`game:${gameId}`).emit('game:timer', {
          whiteTimeMs: gameRoom.whiteTimeMs,
          blackTimeMs: gameRoom.blackTimeMs,
          currentTurn: gameRoom.currentTurn,
          timerRunning: false,
        });

        clearInterval(gameRoom.timerInterval);
        gameRoom.timerInterval = null;
      }
    }, 1000);
  }

  private clearGameTimer(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (gameRoom?.timerInterval) {
      clearInterval(gameRoom.timerInterval);
      gameRoom.timerInterval = null;
    }
  }

  // Leave a game
  @SubscribeMessage('game:leave')
  handleLeaveGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`game:${data.gameId}`);

    if (this.activeGames.has(data.gameId)) {
      const gameRoom = this.activeGames.get(data.gameId);
      gameRoom.players.delete(client.id);
      gameRoom.spectators.delete(client.id);

      if (!gameRoom.gameStarted) {
        if (gameRoom.white === client.id) {
          gameRoom.white = null;
        }
        if (gameRoom.black === client.id) {
          gameRoom.black = null;
        }
      }

      if (gameRoom.players.size === 0) {
        this.clearGameTimer(data.gameId);
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

    const room = this.server.sockets.adapter.rooms.get(roomName);
    const roomMembers = Array.from(room || []);
    console.log(`Room "${roomName}" members (${room?.size || 0})"`, roomMembers);

    const recipients = roomMembers.filter(id => id !== client.id);
    console.log(`Recipients (excluding sender):`, recipients);

    try {
      if (!data.gameId || !data.move || !data.fen) {
        throw new WsException('Invalid move data');
      }

      const user = client.data.user;
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

      if (gameRoom) {
        gameRoom.fen = data.fen;
        gameRoom.pgn = data.pgn;
      }

      gameRoom.currentTurn = gameRoom.currentTurn === 'w' ? 'b' : 'w';

      if (gameRoom.timerRunning && gameRoom.lastMoveAt) {
        const elapsed = Date.now() - gameRoom.lastMoveAt;
        if (gameRoom.currentTurn === 'b') {
          gameRoom.whiteTimeMs = Math.max(0, gameRoom.whiteTimeMs - elapsed);
        } else {
          gameRoom.blackTimeMs = Math.max(0, gameRoom.blackTimeMs - elapsed);
        }

        gameRoom.lastMoveAt = Date.now();

        this.server.to(roomName).emit('game:timer', {
          whiteTimeMs: gameRoom.whiteTimeMs,
          blackTimeMs: gameRoom.blackTimeMs,
          currentTurn: gameRoom.currentTurn,
          timerRunning: true,
        });
      }
      console.log(`Move in game ${data.gameId}:`, data.move);

      this.gameService.updateGame(data.gameId, {
        fen: data.fen,
        moves: data.pgn,
      }).catch((err) => {
          console.log('Failed to save game state to DB (non-fatal):', err.message);
     });

      return { success: true };
    } catch (error) {
      console.error('Error handling move:', error);

      client.emit('error', {
        message: error.message || 'failed to process move',
      });

      return { success: false, error: error.message };
    }
  }
 

  @SubscribeMessage('game:over')
  handleGameOver(
    @MessageBody() data: { gameId: string; winner: string; result: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameRoom = this.activeGames.get(data.gameId);
    if (gameRoom) {
      gameRoom.timerRunning = false;
      this.clearGameTimer(data.gameId);
    }

    // Broadcast gameover to all players
    this.server.to(`game:${data.gameId}`).emit('game:over', {
      winner: data.winner,
      result: data.result,
    });

    return { success: true };
  }

  // Message
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @MessageBody() data: { gameId?: string; message: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.gameId) {
      // Send to specific game
      client.to(`game:${data.gameId}`).emit('chat:message', {
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
      });
    } else {
      // Broadcast to all users (global chat)
      this.server.emit('chat:message', {
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
      });
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
      count: this.activeGames.get(data.gameId)?.spectators.size || 0,
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

  @SubscribeMessage('matchmaking:find')
  async handleFindMatch(
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const gameId = await this.gameService.findOpponent(user.userId, client.id);

    if (gameId) {
      client.emit('matchmaking:found', { gameId, color: 'black' });
    } else {
      client.emit('matchmaking:waiting');
    }
  }

  @SubscribeMessage('game:load')
  async handleLoadGame(
    @MessageBody() data: { gameId: string},
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
}
