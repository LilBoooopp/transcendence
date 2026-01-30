import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- 1. Makes this available everywhere without importing it
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- 2. Exports the service so others can use it
})
export class PrismaModule {}
