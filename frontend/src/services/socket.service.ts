import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string): void {
    // Connect to backend Websocket
    this.socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to Websocket server');

      // Identify user if Id provided
      if (userId) {
        this.identifyUser(userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Websocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
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
    this.emit('game:join', { gameId });
  }

  // Leave a gmae room
  leaveGame(gameId: string): void {
    this.emit('game:leave', { gameId });
  }

  // Send a chess move
  sendMove(gameId: string, move: any, fen:string): void {
    this.emit('game:move', { gameId, move, fen });
  }

  // Listen for oppenent's move
  onMove(callback: (data: { move: any; fen: string }) => void): void {
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
  onChatMessage(callback: (data: { userId: string; message: string; timestamp: Date}) => void) {
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
  private on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
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
}

export const socketService = new SocketService();
