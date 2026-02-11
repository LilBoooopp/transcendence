import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string): void {
    console.log('Connecting to Websocket via current origin...');
    this.socket = io({
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to Websocket server, socket ID:', this.socket?.id);

      // Identify user if Id provided
      if (userId) {
        this.identifyUser(userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Websocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  identifyUser(userId: string): void {
    this.emit('user:identify', { userId });
  }

  // Join a game room
  joinGame(gameId: string): void {
    console.log('Joining game:', gameId);
    this.emit('game:join', { gameId });
  }

  loadGame(gameId: string): void {
    console.log('Loading game:', gameId);
    this.emit('game:load', { gameId} );
  }

  onGameLoaded(callback: (data: { gameId: string; fen: string; moves: any, pgn?: string }) => void): void {
    this.on('game:loaded', callback);
  }

  // Leave a gmae room
  leaveGame(gameId: string): void {
    this.emit('game:leave', { gameId });
  }

  // Send a chess move
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

  // Send chat message
  sendChatMessage(message:string, userId: string, gameId?: string): void {
    this.emit('chat:message', { message, userId, gameId });
  }

  // Listen for chat messages
  onChatMessage(callback: (data: { userId: string; message: string; timestamp: Date}) => void): void {
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
    return () => {};
  }

  // Remove listener
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Listen for role assignment from server
  onRoleAssigned(callback: (data: { gameId: string; role: 'white' | 'black' | 'spectator' }) => void): void {
    this.on('game:role-assigned', callback);
  }
}

export const socketService = new SocketService();
