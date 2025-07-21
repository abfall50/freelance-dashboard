import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';

@Module({
  controllers: [MissionController],
  providers: [MissionService, PrismaService],
})
export class MissionModule {}
