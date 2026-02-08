@Injectable()
export class GameService {
  private waitingPlayers: Map<string, string> = new Map(); // userId to socketId

  // Create a new game
  async createGame(whitePlayerId: string, blackPlayerId: string) {
    const game = await this.prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        status 
      }
    })
  }
}
