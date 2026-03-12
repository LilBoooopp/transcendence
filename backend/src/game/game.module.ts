import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StockfishService } from './stockfish.service';
import { EloModule } from '../elo/elo.module';

@Module({
  imports: [PrismaModule, EloModule],
  providers: [GameGateway, GameService, StockfishService],
  exports: [GameGateway],
})
export class GameModule { }
