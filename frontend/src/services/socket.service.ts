import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private persistentListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;


  connect(userId?: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected, skipping connect');
      return;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('Connecting to Websocket via current origin...');

    this.socket = io({
      transports: ['polling', 'websocket'],
      auth: {
        token: localStorage.getItem('token') ?? '',
      },
    });

    for (const [event, callbacks] of this.persistentListeners) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }

    this.socket.on('connect', () => {
      console.log('Connected to Websocket server, socket ID:', this.socket?.id);

      // Identify user if Id provided
      if (userId) {
        this.identifyUser(userId);
      }
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = setInterval(() => {
        this.emit('heartbeat', {});
      }, 30000);
    });


    this.socket.on('disconnect', () => {
      console.log('Disconnected from Websocket server');
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  //STARTGAME JOIN GAME
  identifyUser(userId: string): void {
    this.emit('user:identify', { userId });
  }

  // Join a game room
  joinGame(gameId: string, timeControlKey?: string, claimedRole?: string): void {
    console.log('Joining game:', gameId);
    this.emit('game:join', { gameId, timeControlKey, claimedRole });
  }

  // Leave a gmae room
  leaveGame(gameId: string): void {
    this.emit('game:leave', { gameId });
  }

  loadGame(gameId: string): void {
    console.log('Loading game:', gameId);
    this.emit('game:load', { gameId });
  }

  onGameLoaded(callback: (data: { gameId: string; fen: string; moves: any, pgn?: string }) => void): void {
    this.on('game:loaded', callback);
  }

  joinMatchmaking(timeControlKey: string): void {
    console.log(`Joining matchmaking queue: ${timeControlKey}`);
    this.emit('matchmaking:join', { timeControlKey });
  }

  cancelMatchmaking(): void {
    this.emit('matchmaking:cancel', {});
  }

  onMatchmakingFound(callback: (data: { gameId: string; role: 'white' | 'black' }) => void): void {
    this.on('matchmaking:found', callback);
  }

  onMatchmakingWaiting(callback: () => void): void {
    this.on('matchmaking:waiting', callback);
  }

  joinBotGame(gameId: string, difficulty: 'easy' | 'medium' | 'hard', timeControlKey?: string): void {
    console.log(`Joining bot game: ${gameId} (${difficulty}) [${timeControlKey ?? 'default'}]`);
    this.emit('game:bot-join', { gameId, difficulty, timeControlKey });
  }

  sendMove(gameId: string, move: any, fen: string, pgn: string): void {
    console.log('Sending move:', move);
    this.emit('game:move', { gameId, move, fen, pgn });
  }

  // Listen for oppenent's move
  onMove(callback: (data: { move: any; fen: string; pgn: string }) => void): void {
    this.on('game:move', callback);
  }

  // Send game over
  sendGameOver(gameId: string, winner: string, result: string): void {
    this.emit('game:over', { gameId, winner, result });
  }

  // Listen for game over
  onGameOver(callback: (data: { winner: string; result: string }) => void): void {
    this.on('game:over', callback);
  }

  sendResign(gameId: string): void {
    this.emit('game:resign', { gameId });
  }

  sendDrawOffer(gameId: string): void {
    this.emit('game:draw-offer', { gameId });
  }

  sendDrawResponse(gameId: string, accepted: boolean): void {
    this.emit('game:draw-response', { gameId, accepted });
  }

  sendChatMessage(message: string, userId: string, gameId?: string): void {
    this.emit('chat:message', { message, userId, gameId });
  }

  // Listen for chat messages
  onChatMessage(callback: (data: { userId: string; message: string; timestamp: Date }) => void): void {
    this.on('chat:message', callback);
  }

  // Join as spectator
  spectateGame(gameId: string): void {
    this.emit('spectate:join', { gameId });
  }

  // Listen for spectator count
  onSpectatorCount(callback: (data: { gameId: string; count: number }) => void): void {
    this.on('spectate:count', callback);
  }

  // Listen for role assignment from server
  onRoleAssigned(callback: (data: { gameId: string; role: 'white' | 'black' | 'spectator' }) => void): void {
    this.on('game:role-assigned', callback);
  }

  onGameState(callback: (data: { gameId: string; fen: string; pgn: string }) => void): void {
    this.on('game:state', callback);
  }

  onTimer(callback: (data: { whiteTimeMs: number; blackTimeMs: number; currentTurn: string; timerRunning: boolean }) => void): void {
    this.on('game:timer', callback);
  }

  onPersistent(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.persistentListeners.has(event)) {
      this.persistentListeners.set(event, new Set());
    }
    this.persistentListeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      this.persistentListeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    }
  }


  // Generic emit
  private emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket not connected');
    }
  }

  // Generic listener
  on(event: string, callback: any): () => void {
    if (this.socket) {
      this.socket.on(event, callback);
      return () => this.socket?.off(event, callback);
    }
    return () => { };
  }

  // Remove listener
  off(event: string, callback?: any): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }


}

export const socketService = new SocketService();
