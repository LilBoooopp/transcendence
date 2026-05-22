import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JWT_SECRET } from '../configs/jwtsecret';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (!authorization) throw new UnauthorizedException('No authorization header');

    const token = authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const tokenPayload = await this.jwtService.verifyAsync(token);
      const user = await this.prisma.user.findUnique({
        where: { id: tokenPayload.sub },
        select: { isBanned: true },
      });
      if (user?.isBanned) throw new UnauthorizedException('Your account has been banned');
      request.user = { userId: tokenPayload.sub, username: tokenPayload.username };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Token');
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const tokenPayload = await this.jwtService.verifyAsync(token);
      const user = await this.prisma.user.findUnique({
        where: { id: tokenPayload.sub },
        select: { role: true, isBanned: true },
      });
      if (!user || user.isBanned) throw new UnauthorizedException('Account unavailable');
      if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
      request.user = { userId: tokenPayload.sub, username: tokenPayload.username };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid Token');
    }
  }
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token;
    if (!token) throw new UnauthorizedException('No authentication token');

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { isBanned: true },
      });
      if (user?.isBanned) throw new UnauthorizedException('Your account has been banned');
      client.data.userId = payload.sub;
      client.data.username = payload.username;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid token');
    }
  }
}
