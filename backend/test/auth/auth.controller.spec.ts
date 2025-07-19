import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';

describe('AuthService', () => {
  let controller: AuthController;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        PrismaService,
        AuthService,
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('mockToken') } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should register a new user and return tokens', async () => {
    const userInput = {
      email: 'signup-test@exemple.com',
      password: 'signup-test-pwd-123',
    };

    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    prisma.user.create = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: userInput.email,
      password: await bcrypt.hash(userInput.password, 10),
      createdAt: new Date(),
    });

    const result = await controller.signup(userInput);

    expect(result).toEqual({
      accessToken: 'mockToken',
      refreshToken: 'mockToken',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userInput.email },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: userInput.email,
        password: expect.any(String),
      },
    });
  });

  it('should log in a user and return tokens', async () => {
    const userInput = {
      email: 'login-test@exemple.com',
      password: 'login-test-pwd-123',
    };

    const storedUser = {
      id: 'user-id',
      email: userInput.email,
      password: await bcrypt.hash(userInput.password, 10),
      createdAt: new Date(),
    };

    prisma.user.findUnique = jest.fn().mockResolvedValue(storedUser);

    jest.spyOn(bcrypt, 'compare' as any).mockResolvedValue(true);

    const result = await controller.login(userInput);

    expect(result).toEqual({
      accessToken: 'mockToken',
      refreshToken: 'mockToken',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userInput.email },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(userInput.password, storedUser.password);
  });
});
