import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EloService } from '../elo/elo.service';

export interface GameRoomSnapshot {
  gameStartedAt: number | null;
  fen?: string;
  pgn?: string;
  moveCount: number;
  whiteUserId: string | null;
  blackUserId: string | null;
}

function toDbResult(winner: string): 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' {
  if (winner === 'White') return 'WHITE_WIN';
  if (winner === 'Black') return 'BLACK_WIN';
  return 'DRAW';
}

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eloService: EloService,
  ) {}

  async createGame(
    whitePlayerId: string,
    blackPlayerId: string,
    id: string,
    timeControl?: string,
  ) {
    return this.prisma.game.upsert({
      where: { id },
      create: {
        id,
        whitePlayerId,
        blackPlayerId,
        timeControl,
        status: 'IN_PROGRESS',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        startedAt: new Date(),
      },
      update: {},
    });
  }

  async updateGame(gameId: string, data: { fen: string; moves: any }) {
    return this.prisma.game.update({
      where: { id: gameId },
      data: { fen: data.fen, moves: data.moves },
    });
  }

  async getGame(gameId: string) {
    return this.prisma.game.findUnique({
      where: { id: gameId },
      include: { whitePlayer: true, blackPlayer: true },
    });
  }

  async createBotGame(
    userId: string,
    color: 'white' | 'black',
    difficulty: string,
    aiDifficultyInt: number,
    timeControl: string,
    id: string,
  ) {
    return this.prisma.game.create({
      data: {
        id,
        whitePlayerId: color === 'white' ? userId : null,
        blackPlayerId: color === 'black' ? userId : null,
        status: 'IN_PROGRESS',
        isAiGame: true,
        aiDifficulty: aiDifficultyInt,
        timeControl,
        startedAt: new Date(),
      },
    });
  }

  async persistGameResult(
    gameId: string,
    winner: string,
    result: string,
    abandoned = false,
    room?: GameRoomSnapshot,
  ): Promise<void> {
    const endedAt = new Date();

    try {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        select: {
          whitePlayerId: true,
          blackPlayerId: true,
          timeControl: true,
          isRanked: true,
          isAiGame: true,
          startedAt: true,
        },
      });

      const startMs =
        room?.gameStartedAt ?? (game?.startedAt ? game.startedAt.getTime() : null);
      const playTimeSeconds = startMs
        ? Math.max(0, Math.floor((endedAt.getTime() - startMs) / 1000))
        : 0;

      await this.prisma.game.update({
        where: { id: gameId },
        data: {
          status: abandoned ? 'ABANDONED' : 'COMPLETED',
          result: toDbResult(winner),
          winner: winner.toLowerCase(),
          endedAt,
          fen: room?.fen ?? undefined,
          pgn: room?.pgn ?? undefined,
          moves: room?.pgn ?? undefined,
          totalMoves: room ? Math.ceil(room.moveCount / 2) : undefined,
        },
      });

      const whiteId = room?.whiteUserId ?? game?.whitePlayerId ?? null;
      const blackId = room?.blackUserId ?? game?.blackPlayerId ?? null;
      const w = winner.toLowerCase();

      if (!game?.isAiGame) {
        if (whiteId) {
          const outcome: 'win' | 'draw' | 'loss' =
            w === 'white' ? 'win' : w === 'draw' ? 'draw' : 'loss';
          await this.updatePlayerStats(whiteId, outcome, playTimeSeconds);
        }
        if (blackId) {
          const outcome: 'win' | 'draw' | 'loss' =
            w === 'black' ? 'win' : w === 'draw' ? 'draw' : 'loss';
          await this.updatePlayerStats(blackId, outcome, playTimeSeconds);
        }
      }

      if (!abandoned && game?.isRanked && !game?.isAiGame && whiteId && blackId) {
        await this.eloService.processGameResult(
          gameId,
          game.timeControl,
          whiteId,
          blackId,
          winner,
        );
      }
    } catch (e) {
      console.warn(`Failed to persist result for game ${gameId} (non-fatal):`, e.message);
    }
  }

  async updatePlayerStats(
    userId: string,
    outcome: 'win' | 'draw' | 'loss',
    playTimeSeconds: number,
  ): Promise<void> {
    const stats = await this.prisma.userStatistics.upsert({
      where: { userId },
      create: { userId, bulletElo: 1200, blitzElo: 1200, rapidElo: 1200 },
      update: {},
    });

    const newStreak = outcome === 'win' ? stats.currentStreak + 1 : 0;
    const newBestStreak = Math.max(stats.bestStreak, newStreak);

    await this.prisma.userStatistics.update({
      where: { userId },
      data: {
        totalGames: { increment: 1 },
        wins: outcome === 'win' ? { increment: 1 } : undefined,
        losses: outcome === 'loss' ? { increment: 1 } : undefined,
        draws: outcome === 'draw' ? { increment: 1 } : undefined,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        totalPlayTime: { increment: playTimeSeconds },
      },
    });
  }
}
