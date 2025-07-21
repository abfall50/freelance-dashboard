import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET, expiresIn: process.env.JWR_EXPIRES_IN },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async comparePasswords(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  async createUser(email: string, hashedPassword: string) {
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
  }

  async createSession(userId: string, refreshToken: string, ip?: string, userAgent?: string) {
    const expiresAt = add(new Date(), {
      days: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        ip,
        userAgent,
        expiresAt,
      },
    });
  }

  async deleteSessionsForUser(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }
}
