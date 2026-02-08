@Injectable()
export class GameService {
  private waitingPlayers: Map<string, string> = new Map(); // userId to socketId

  // Create a new game
  async createGame(whitePlayerId: string, blackPlayerId: string) {
    const game = await this.prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        status: 'IN_PROGRESS',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      },
    });
    return (game);
  }

  // Find or create game
  async findOpponent(userId: string, socketId: string): Promise<string | null> {
    // is someone waiing
    const entries = Array.from(this.waitingPlayers.entries());

    if (entries.length > 0) {
      const [opponentId, opponentSocketId] = entries[0];
      this.waitingPlayers.delete(opponentId);

      /// make game with matched plaeyrs
      const game = await this.createGame(opponentId, userId);
      return (game.id);
    } else {
      // noone waiting, add to waitlist
      this.waitingPlayers.set(userId, socketId);
      return (null);
    }
  }
}
