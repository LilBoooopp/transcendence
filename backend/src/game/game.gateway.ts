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

@WebSocketGateway({
  cors: {
    origin: '*', // need to specify URL
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store connections
  private activeUsers = new Map<string, string>();

  //Store games
  private activeGames = new Map<string, Set<string>>();

  //new connection
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  //disconnections
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: $(client.id)`);

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
    for (const [gameId, players] of this.activeGames.entries()) {
      if (players.has(client.id)) {
        players.delete(client.id);
        if (players.size === 0) {
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
      this.activeGames.set(data.gameId, new Set());
    }
    this.activeGames.get(data.gameId).add(client.id);

    console.log(`Client ${client.id} joined game ${data.gameId}`);

    // Notify others in the game
    client.to(roomName).emit('game:player-joined', {
      gameId: data.gameId,
      playersCount: this.activeGames.get(data.gameId).size,
    });

    return { success: true, gameId: data.gameId };
  }

  // Leave a game
  @SubscribeMessage('game:leave')
  handleLeaveGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`game:${data.gameId}`);

    if (this.activeGames.has(data.gameId)) {
      this.activeGames.get(data.gameId).delete(client.id);
      if (this.activeGames.get(data.gameId).size === 0) {
        this.activeGames.delete(data.gameId);
      }
    }

    return { success: true };
  }

  @SubscribeMessage('game:move')
  handleMove(
    @MessageBody() data: { gameId: string; move: any; fen: string },
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
      const game = this.activeGames.get(data.gameId);

      if (!game || !game.has(client.id)) {
        throw new WsException('You are not in this game');
      }

      console.log(`Broadcasting 'game:move' event to room...`);
      client.to(roomName).emit('game:move', {
        move: data.move,
        fen: data.fen,
      });

      await this.gameService.updateGame(data.gameId, {
        fen: data.fen,
        moves: data.move,
      });

      console.log(`Move in game ${data.gameId}:`, data.move);

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
      count: this.activeGames.get(data.gameId)?.size || 0,
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
    const game = await this.prisma.game.findUnique({
      where: { id: data.gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!game) {
      throw new WsException('Game not found');
    }

    client.emit('game:loaded', {
      gameId: game.id,
      fen: game.fen,
      moves: game.moves,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
    });

    return { success: true };
  }
}
