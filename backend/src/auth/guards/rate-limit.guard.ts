import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // quota par user
    const userId = req.user?.userId;
    if (userId) return `user:${userId}`;

    // quota par ip
    // req.ip is the address nginx saw ('trust proxy' is 1 in main.ts). Never read X-Forwarded-For
    // directly: its leftmost entry is whatever the client sent, so each request could pick a new bucket.
    return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  }
}