import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

/**
 * Notification types that map to toast variants on the frontend
 * 'success' | 'error' | 'info' | 'warning' | 'game'
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'game';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  /** Optional: duration in ms before auto-dismiss (default 5000) */
  duration?: number;
  /** Optional: action label for a clickable link/button inside the toast */
  action?: {
    label: string;
    /** Client-side route to navigate to */
    route?: string;
  };
}

/**
 * NotificationService
 *
 * Provides a centralized a way to push ephemeral notifications to connected clients via socket.io.
 */
@Injectable()
export class NotificationService {
  private server: Server | null = null;

  /**
   * Called by NotificationGateway.afterInit() to hand over the shared socket.io server instance.
   */
  setServer(server: Server): void {
    this.server = server;
  }

  // targeted notifs

  /**
   * send a notification to a specific userId
   * Requires the user to have joined their persnonal room (`user:<userId>`)
   */
  notifyUser(userId: string, payload: NotificationPayload): void {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification:push', payload);
  }

  /**
   * Send a notification to everyone in a specific game room
   */
  notifyGameRoom(gameId: string, payload: NotificationPayload): void {
    if (!this.server) return;
    this.server.to(`game:${gameId}`).emit('notification:push', payload);
  }

  /**
   * broadcast a notif to all connected clients.
   */
  notifyAll(payload: NotificationPayload): void {
    if (!this.server) return;
    this.server.emit('notification:push', payload);
  }

  // helpers

  /** Game created / match found */
  gameCreated(userId: string, gameId: string, opponent?: string): void {
    this.notifyUser(userId, {
      type: 'game',
      title: 'Match Found',
      message: opponent
        ? `You've been matched against ${opponent}!`
        : 'A new game has been created',
      action: { label: 'Join Game', route: `/game/${gameId}` },
    });
  }

  /** Game over */
  gameOver(gameId: string, result: string, winner?: string): void {
    this.notifyGameRoom(gameId, {
      type: 'info',
      title: 'Game Over',
      message: winner ? `${winner} wins by ${result}` : `Game ended in ${result}`,
      duration: 8000,
    });
  }

  /** friend request sent / received */
  friendRequest(toUserId: string, fromUsername: string): void {
    this.notifyUser(toUserId, {
      type: 'info',
      title: 'Friend Request',
      message: `${fromUsername} sent you a friend request.`,
      duration: 7000,
    });
  }

  /** friend request accepted */
  friendAccepted(toUserId: string, friendUsername: string): void {
    this.notifyUser(toUserId, {
      type: 'success',
      title: 'Friend Added',
      message: `${friendUsername} accepted your freind request!`,
    });
  }

  /** friend removed */
  friendRemoved(toUserId: string, friendUsername: string): void {
    this.notifyUser(toUserId, {
      type: 'warning',
      title: 'Friend Removed',
      message: `${friendUsername} has been removed from your friends list.`,
    });
  }

  /** Opponent disconnected */
  opponentDisconnected(userId: string, seconds: number): void {
    this.notifyUser(userId, {
      type: 'warning',
      title: 'Opponent Disconnected',
      message: `Your opponent disconnected. They have ${seconds}s to reconnect.`,
      duration: seconds * 1000,
    });
  }

  opponentReconnected(userId: string): void {
    this.notifyUser(userId, {
      type: 'success',
      title: 'Opponent Reconnected',
      message: 'Your opponent is back! The game continues.',
      duration: 3000,
    });
  }

  /** Connection status */
  connectionRestored(userId: string): void {
    this.notifyUser(userId, {
      type: 'success',
      title: 'Connection Restored',
      message: 'You are back online.',
      duration: 3000,
    });
  }

  /** Generic error */
  error(userId: string, message: string): void {
    this.notifyUser(userId, {
      type: 'error',
      title: 'Error',
      message,
      duration: 6000,
    });
  }

  /** Draw offered */
  drawOffered(userId: string, opponentName?: string): void {
    this.notifyUser(userId, {
      type: 'info',
      title: 'Draw Offered',
      message: opponentName
        ? `${opponentName} is offering a draw.`
        : 'Your opponent is offering a draw.',
      duration: 10000,
    });
  }

  /** draw declined */
  drawDeclined(userId: string): void {
    this.notifyUser(userId, {
      type: 'warning',
      title: 'Draw Declined',
      message: 'Your draw offer was declined.',
      duration: 4000,
    });
  }

  /** elo rating change */
  eloChange(userId: string, oldElo: number, newElo: number): void {
    const diff = newElo - oldElo;
    const sign = diff >= 0 ? '+' : '';
    this.notifyUser(userId, {
      type: diff >= 0 ? 'success' : 'warning',
      title: 'Rating Updated',
      message: `Your rating is now ${newElo} (${sign}${diff}).`,
      duration: 6000,
    });
  }
}
