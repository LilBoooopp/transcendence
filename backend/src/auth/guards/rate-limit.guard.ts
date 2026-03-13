import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>, context: ExecutionContext): Promise<string> | string {
    // 1) Utilisateur authentifie -> quota par user
    const userId = req.user?.id;
    if (userId) return `user:${userId}`;

    // 2) Sinon quota par IP reelle (proxy-aware)
    const xff = req.headers?.['x-forwarded-for'];
    const ipFromProxy = Array.isArray(xff) ? xff[0] : xff?.split(',')[0]?.trim();
    const ip = ipFromProxy || req.ip || req.socket?.remoteAddress || 'unknown';

    return `ip:${ip}`;
  }
}