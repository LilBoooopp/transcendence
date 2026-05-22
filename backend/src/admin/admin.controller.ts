import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/guards/auth.guards';
import { GameGateway } from '../game/game.gateway';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Get('users')
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
        isOnline: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('users/:userId/ban')
  async banUser(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isBanned: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new BadRequestException('Cannot ban an admin');
    if (target.isBanned) throw new BadRequestException('User is already banned');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedAt: new Date(), banReason: body.reason ?? null },
    });

    this.gameGateway.kickUser(userId);

    return { success: true, userId, reason: body.reason };
  }

  @Post('users/:userId/unban')
  async unbanUser(@Param('userId') userId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBanned: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (!target.isBanned) throw new BadRequestException('User is not banned');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedAt: null, banReason: null },
    });

    return { success: true, userId };
  }

  @Post('users/:userId/promote')
  async promoteUser(@Param('userId') userId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new BadRequestException('User is already an admin');

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    });

    return { success: true, userId };
  }
}
