import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StockfishService } from './stockfish.service';

@Module({
  imports: [PrismaModule],
  providers: [GameGateway, GameService, StockfishService],
  exports: [GameGateway],
})
export class GameModule {}
