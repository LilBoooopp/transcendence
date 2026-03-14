import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/auth/configs/jwtsecret';

/**
 * NotificationGateway
 *
 * its only responsibilities:
 *     1. hand the server ref to notificationservice on init
 *     2. auto-join every authenticated socket into a personal room (`user:<userId>`) so NotificationService.notifyUser() can target them
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * afterInit runs once when the gateway is ready
   * we pass the server to notificationService so it can emit events
   */
  afterInit(server: Server): void {
    this.notificationService.setServer(server);
    console.log('[NotificationGateway] Initialized - server reference set');
  }

  /**
   * when a socket connects, join it into a personal room keyed by userId.
   * lets NotificationService.notifyUser() reach the right client
   * if jwt not set yet (data race), verify token
   */
  async handleConnection(client: Socket): Promise<void> {
    let userId = client.data?.userId;

    if (!userId) {
      const token = client.handshake.auth?.token;
      if (!token) return;
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: JWT_SECRET,
        });
        userId = payload.sub;
        client.data.userId = userId;
      } catch {
        return;
      }
    }

    client.join(`user:${userId}`);
    console.log(`[NotificationGateway] Socket ${client.id} joined room user: ${userId}`);
  };

  handleDisconnect(client: Socket): void {
    // socket.io removes automatically
  }
}
