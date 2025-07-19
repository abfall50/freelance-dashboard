import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const userExists = await this.authService.getUserByEmail(body.email);

    if (userExists) throw new Error('Email already taken');

    const hashedPassword = await this.authService.hashPassword(body.password);

    const user = await this.authService.createUser(body.email, hashedPassword);

    return this.authService.generateTokens(user.id, user.email);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authService.getUserByEmail(body.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await this.authService.comparePasswords(body.password, user.password);

    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.authService.generateTokens(user.id, user.email);
  }
}
