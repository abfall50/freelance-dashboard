import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async findUserByEmail(email?: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async updateUser(userId: string, updateData: { email?: string; password?: string }) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }
}
