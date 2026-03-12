import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private waitingPlayers: Map<string, string> = new Map(); // userId to socketId

  constructor(private prisma: PrismaService) { }

  /**
  * Creates or no-ops a game row.
  * startedAt is set here so persistGameResult can compute totalPlayTime even if gameRoom memory cleared.
  */
  async createGame(
    whitePlayerId: string,
    blackPlayerId: string,
    id: string,
    timeControl?: string
  ) {
    return (this.prisma.game.upsert({
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
    }));
  }

  // Find or create game
  async findOpponent(userId: string, socketId: string): Promise<string | null> {
    // is someone waiing
    const entries = Array.from(this.waitingPlayers.entries());

    if (entries.length > 0) {
      const [opponentId] = entries[0];
      this.waitingPlayers.delete(opponentId);

      /// make game with matched plaeyrs
      const gameId = uuidv4();
      const game = await this.createGame(opponentId, userId, gameId);
      return (game.id);
    } else {
      // noone waiting, add to waitlist
      this.waitingPlayers.set(userId, socketId);
      return (null);
    }
  }

  async getOrCreateGame(gameId: string) {
    let game = await this.prisma.game.findUnique({ where: { id: gameId } });

    if (!game) {
      game = await this.prisma.game.create({
        data: {
          id: gameId,
          status: 'WAITING',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
      });
    }

    return (game);
  }

  async updateGame(gameId: string, data: { fen: string; moves: any }) {
    return (this.prisma.game.update({
      where: { id: gameId },
      data: {
        fen: data.fen,
        moves: data.moves,
      },
    }));
  }

  async getGame(gameId: string) {
    return (this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    }));
  }

  async createBotGame(
    userId: string,
    color: 'white' | 'black',
    difficulty: string,
    aiDifficultyInt: number,
    timeControl: string,
    id: string,
  ) {
    return (this.prisma.game.create({
      data: {
        id,
        whitePlayerId: color === 'white' ? userId : null,
        blackPlayerId: color === 'black' ? userId : null,
        status: 'IN_PROGRESS',
        isAiGame: true,
        aiDifficultyInt: aiDifficultyInt,
        timeControl,
        startedAt: new Date(),
      },
    }));
  }
}
