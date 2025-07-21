import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userExists = await this.userService.findUserByEmail(body.email);

    if (userExists) throw new Error('Email already taken');

    const hashedPassword = await this.authService.hashPassword(body.password);

    const user = await this.authService.createUser(body.email, hashedPassword);

    const tokens = await this.authService.generateTokens(user.id, user.email);

    await this.authService.createSession(
      user.id,
      tokens.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    return tokens;
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findUserByEmail(body.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await this.authService.comparePasswords(body.password, user.password);

    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.authService.generateTokens(user.id, user.email);

    await this.authService.deleteSessionsForUser(user.id);

    await this.authService.createSession(
      user.id,
      tokens.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    return tokens;
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @GetUser() user: any,
    @Req() req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = req.headers['authorization']?.replace('Bearer ', '');
    if (!refreshToken) throw new UnauthorizedException();

    const session = await this.prisma.session.findFirst({
      where: {
        userId: user.sub,
        refreshToken,
      },
    });

    if (!session) throw new UnauthorizedException('Invalid session');
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    const tokens = await this.authService.generateTokens(user.sub, user.email);

    await this.authService.createSession(
      user.sub,
      tokens.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );

    return tokens;
  }
}
