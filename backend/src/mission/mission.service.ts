import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.mission.findMany({
      where: {
        userId,
      },
    });
  }

  async create(userId: string, dto: CreateMissionDto) {
    return this.prisma.mission.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        status: dto.status,
        date: new Date(dto.date),
        user: {
          connect: {
            id: userId,
          },
        },
        client: {
          connect: {
            id: dto.clientId,
          },
        },
      },
    });
  }

  async findOne(userId: string, missionId: string) {
    return this.prisma.mission.findFirst({
      where: {
        id: missionId,
        userId,
      },
    });
  }

  async update(userId: string, missionId: string, dto: UpdateMissionDto) {
    const mission = await this.prisma.mission.findFirst({
      where: {
        id: missionId,
        userId,
      },
    });
    if (!mission) return null;

    return this.prisma.mission.update({
      where: {
        id: missionId,
      },
      data: dto,
    });
  }

  async delete(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findFirst({
      where: {
        id: missionId,
        userId,
      },
    });
    if (!mission) return null;

    await this.prisma.mission.delete({
      where: {
        id: missionId,
      },
    });

    return { id: missionId };
  }
}
