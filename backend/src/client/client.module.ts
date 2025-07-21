import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, PrismaClient],
})
export class ClientModule {}
