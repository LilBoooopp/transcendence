import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  controllers: [AdminController],
})
export class AdminModule {}
