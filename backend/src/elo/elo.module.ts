import { Module } from '@nestjs/common';
import { EloService } from './elo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EloService],
  exports: [EloService],
})
export class EloModule { }
