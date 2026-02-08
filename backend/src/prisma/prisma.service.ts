import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaClient extends PrismaClient implements OnModuleInit {
  async OnModuleInit() {
    await this.$connect();
    console.log('prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
