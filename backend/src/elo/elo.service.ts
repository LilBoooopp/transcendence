import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type GameType = 'BULLET' | 'BLITZ' | 'RAPID';
export type GameOutcome = 'win' | 'draw' | 'loss';

@Injectable()
export class EloService {
  private readonly logger = new Logger(EloService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * called after every ranked game ends.
   * calculates elo changes and updates statistics
   *
   * @param gameId - DB game id
   * @param timeControl - e.g. "5+0", "2+1", etc
   * @param whiteId - userId of white player
   * @param blackId - userId of black player
   * @param winner - "white" | "black" | "draw" (lowercase)
  */
  async processGameResult(
    gameId: string,
    timeControl: string | null,
    whiteId: string | null,
    blackId: string | null,
    winner: string,
  ): Promise<void> {
    if (!whiteId || !blackId) return;

    const gameType = this.classifyTimeControl(timeControl);

    const [whiteStats, blackStats] = await Promise.all([
      this.getOrCreateStats(whiteId),
      this.getOrCreateStats(blackId),
    ]);

    const whiteElo = this.getEloForType(whiteStats, gameType);
    const blackElo = this.getEloForType(blackStats, gameType);

    const w = winner.toLowerCase();
    let whiteOutcome: GameOutcome = w === 'white' ? 'win' : w === 'draw' ? 'draw' : 'loss';
    let blackOutcome: GameOutcome = w === 'black' ? 'win' : w === 'draw' ? 'draw' : 'loss';

    // K-factor uses totalGames which is updated by updatePlayerStats BEFORE processGameResult is called, so the count already includes this game.
    const whiteDelta = this.computeDelta(whiteElo, blackElo, whiteOutcome, whiteStats.totalGames);
    const blackDelta = this.computeDelta(blackElo, whiteElo, blackOutcome, blackStats.totalGames);

    const newWhiteElo = Math.max(100, whiteElo + whiteDelta);
    const newBlackElo = Math.max(100, blackElo + blackDelta);

    this.logger.log(
      `ELO [${gameType}] white ${whiteElo}->${newWhiteElo} (${whiteDelta} > 0 ? '+' : ''})` +
      ` | black ${blackElo}->${newBlackElo} (${blackDelta > 0 ? '+' : ''}${blackDelta})`,
    );

    await this.prisma.$transaction([
      // white elo history 
      this.prisma.eloHistory.create({
        data: {
          userId: whiteId,
          gameId,
          gameType,
          eloBefore: whiteElo,
          eloAfter: newWhiteElo,
          eloChange: whiteDelta,
          opponentElo: blackElo,
          result: whiteOutcome,
        },
      }),
      // black elo history
      this.prisma.eloHistory.create({
        data: {
          userId: blackId,
          gameId,
          gameType,
          eloBefore: blackElo,
          eloAfter: newBlackElo,
          eloChange: blackDelta,
          opponentElo: whiteElo,
          result: blackOutcome,
        },
      }),
      // white stats
      this.prisma.userStatistics.update({
        where: { userId: whiteId },
        data: this.buildEloUpdate(gameType, newWhiteElo),
      }),
      // black stats
      this.prisma.userStatistics.update({
        where: { userId: blackId },
        data: this.buildEloUpdate(gameType, newBlackElo),
      }),
    ]);
  }

  /**
   * Standard ELO delta.
   * K = 32 for provisional players (<30 games), 16 otherwise (FIDE regulations)
   * Result is rounded to nearest int and clamped to [-32, +32].
   */
  private computeDelta(
    playerElo: number,
    opponentElo: number,
    outcome: GameOutcome,
    gamesPlayed: number,
  ): number {
    const K = gamesPlayed < 30 ? 32 : 16;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
    return (Math.round(K * (actual - expected)));
  }

  /**
   * Parse "base+inc" format
   * fallback to RAPID.
   *
   * BULLET : base < 3 min
   * BLITZ : 3 <= base <= 10 min
   * RAPID : base > 10 min
  */
  classifyTimeControl(timeControl: string | null): GameType {
    if (!timeControl) return ('RAPID');

    const match = timeControl.match(/^(\d+)(?:\+(\d+))?$/);
    if (!match) return ('RAPID');

    const effectiveMinutes =
      (parseInt(match[1], 10) + 40 * parseInt(match[2] ?? '0', 10)) / 60;

    if (effectiveMinutes < 3) return ('BULLET');
    if (effectiveMinutes < 10) return ('BLITZ');
    return ('RAPID');
  }

  // helpers

  private getEloForType(stats: any, type: GameType): number {
    if (type === 'BULLET') return (stats.bulletElo);
    if (type === 'BLITZ') return (stats.blitzElo);
    return (stats.rapidElo);
  }

  private buildEloUpdate(type: GameType, newElo: number) {
    if (type === 'BULLET') return ({ bulletElo: newElo });
    if (type === 'BLITZ') return ({ blitzElo: newElo });
    return ({ rapidElo: newElo });
  }

  private async getOrCreateStats(userId: string) {
    return (this.prisma.userStatistics.upsert({
      where: { userId },
      create: { userId, bulletElo: 1200, blitzElo: 1200, rapidElo: 1200 },
      update: {},
    }));
  }
}
