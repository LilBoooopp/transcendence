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

// A signature alone is not enough: the token must carry the account's current fingerprint.
// It is rotated on password change and logout and cleared on deletion, which revokes older tokens.
export function hasCurrentFingerprint(
  payload: { fingerprint?: unknown },
  user: { fingerprint: string | null } | null,
): boolean {
  return !!user?.fingerprint && payload.fingerprint === user.fingerprint;
}

async function checkAccount(prisma: PrismaService, payload: { sub: string; fingerprint?: unknown }): Promise<void> {
  const userId = payload.sub;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, bannedUntil: true, fingerprint: true },
  });
  if (!hasCurrentFingerprint(payload, user)) throw new UnauthorizedException('Session expired');
  if (!user.isBanned) return;
  if (user.bannedUntil && user.bannedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedUntil: null, banReason: null, bannedAt: null },
    });
    return;
  }
  throw new UnauthorizedException('Your account has been banned');
}

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
      await checkAccount(this.prisma, tokenPayload);
      request.user = { userId: tokenPayload.sub };
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
        select: { role: true, isBanned: true, bannedUntil: true, fingerprint: true },
      });
      if (!user) throw new UnauthorizedException('Account unavailable');
      if (!hasCurrentFingerprint(tokenPayload, user)) throw new UnauthorizedException('Session expired');
      if (user.isBanned) {
        if (user.bannedUntil && user.bannedUntil <= new Date()) {
          await this.prisma.user.update({
            where: { id: tokenPayload.sub },
            data: { isBanned: false, bannedUntil: null, banReason: null, bannedAt: null },
          });
        } else {
          throw new UnauthorizedException('Your account has been banned');
        }
      }
      if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
      request.user = { userId: tokenPayload.sub };
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
      await checkAccount(this.prisma, payload);
      client.data.userId = payload.sub;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid token');
    }
  }
}
