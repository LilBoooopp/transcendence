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

  private async getAdminName(adminId: string): Promise<string> {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId }, select: { username: true } });
    return admin?.username ?? 'Unknown';
  }

  // ─── Users ────────────────────────────────────────────────────────────────

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
        bannedUntil: true,
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
    @Body() body: { reason?: string; durationHours?: number },
    @Req() req: any,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, isBanned: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new BadRequestException('Cannot ban an admin');
    if (target.isBanned) throw new BadRequestException('User is already banned');

    const bannedUntil = body.durationHours
      ? new Date(Date.now() + body.durationHours * 3_600_000)
      : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedAt: new Date(), bannedUntil, banReason: body.reason ?? null },
    });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: userId,
        targetName: target.username,
        action: bannedUntil ? 'TEMP_BAN' : 'BAN',
        detail: body.reason ?? null,
      },
    });

    this.gameGateway.kickUser(userId);
    return { success: true, userId, bannedUntil };
  }

  @Post('users/:userId/unban')
  async unbanUser(@Param('userId') userId: string, @Req() req: any) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isBanned: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (!target.isBanned) throw new BadRequestException('User is not banned');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedAt: null, bannedUntil: null, banReason: null },
    });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: userId,
        targetName: target.username,
        action: 'UNBAN',
      },
    });

    return { success: true, userId };
  }

  @Post('users/:userId/promote')
  async promoteUser(@Param('userId') userId: string, @Req() req: any) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'ADMIN') throw new BadRequestException('User is already an admin');

    await this.prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: userId,
        targetName: target.username,
        action: 'PROMOTE',
      },
    });

    return { success: true, userId };
  }

  @Post('users/:userId/demote')
  async demoteUser(@Param('userId') userId: string, @Req() req: any) {
    if (userId === req.user.userId) throw new BadRequestException('Cannot demote yourself');

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true },
    });

    if (!target) throw new NotFoundException('User not found');
    if (target.role !== 'ADMIN') throw new BadRequestException('User is not an admin');

    await this.prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: userId,
        targetName: target.username,
        action: 'DEMOTE',
      },
    });

    return { success: true, userId };
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  @Get('reports')
  async listReports() {
    return this.prisma.report.findMany({
      include: {
        reporter: { select: { id: true, username: true } },
        reported: { select: { id: true, username: true, isBanned: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Post('reports/:reportId/resolve')
  async resolveReport(@Param('reportId') reportId: string, @Req() req: any) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'PENDING') throw new BadRequestException('Report already actioned');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', resolvedById: req.user.userId, resolvedAt: new Date() },
    });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: report.reportedId,
        action: 'REPORT_RESOLVE',
        detail: `Report ${reportId}`,
      },
    });

    return { success: true };
  }

  @Post('reports/:reportId/dismiss')
  async dismissReport(@Param('reportId') reportId: string, @Req() req: any) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'PENDING') throw new BadRequestException('Report already actioned');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED', resolvedById: req.user.userId, resolvedAt: new Date() },
    });

    const adminName = await this.getAdminName(req.user.userId);
    await this.prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        adminName,
        targetId: report.reportedId,
        action: 'REPORT_DISMISS',
        detail: `Report ${reportId}`,
      },
    });

    return { success: true };
  }

  // ─── Audit log ────────────────────────────────────────────────────────────

  @Get('audit-logs')
  async listAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
