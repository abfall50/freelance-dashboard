import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.client.findMany({
      where: {
        userId,
      },
    });
  }

  async create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...dto,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async findOne(userId: string, clientId: string) {
    return this.prisma.client.findFirst({
      where: {
        userId,
        id: clientId,
      },
    });
  }

  async update(userId: string, clientId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) return null;

    return this.prisma.client.update({
      where: {
        id: client.id,
      },
      data: dto,
    });
  }

  async delete(userId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) return null;

    await this.prisma.client.delete({
      where: {
        id: client.id,
      },
    });

    return { id: clientId };
  }
}
