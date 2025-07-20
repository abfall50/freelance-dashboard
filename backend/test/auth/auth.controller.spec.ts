import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { createFakeRequest } from '../utils/fake-request';

describe('AuthService', () => {
  let controller: AuthController;
  let service: AuthService;
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
    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should register a new user and return tokens', async () => {
    const userInput = {
      email: 'signup-test@exemple.com',
      password: 'signup-test-pwd-123',
    };

    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.session.create = jest.fn();
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: userInput.email,
      password: await bcrypt.hash(userInput.password, 10),
      createdAt: new Date(),
    });

    const req = createFakeRequest();
    const result = await controller.signup(userInput, req);

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
    prisma.session.create = jest.fn();

    jest.spyOn(bcrypt, 'compare' as any).mockResolvedValue(true);

    const req = createFakeRequest();
    const result = await controller.login(userInput, req);

    expect(result).toEqual({
      accessToken: 'mockToken',
      refreshToken: 'mockToken',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userInput.email },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(userInput.password, storedUser.password);
  });

  it('should throw if password is invalid', async () => {
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

    jest.spyOn(bcrypt, 'compare' as any).mockResolvedValue(false);

    const req = createFakeRequest();
    await expect(controller.login(userInput, req)).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userInput.email },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(userInput.password, storedUser.password);
  });

  it('should refresh tokens when session is valid', async () => {
    const mockUser = {
      sub: 'user-id',
      email: 'refresh-test@example.com',
    };

    const mockRefreshToken = 'mock-refresh-token';

    const mockSession = {
      id: 'session-id',
      userId: mockUser.sub,
      refreshToken: mockRefreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdAt: new Date(),
      ip: '127.0.0.1',
      userAgent: 'jest-agent',
    };

    prisma.session.findFirst = jest.fn().mockResolvedValue(mockSession);
    prisma.session.create = jest.fn();
    prisma.session.delete = jest.fn();

    service.generateTokens = jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    service.createSession = jest.fn();

    const req = createFakeRequest(mockRefreshToken);
    const result = await controller.refresh(mockUser, req);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        userId: mockUser.sub,
        refreshToken: mockRefreshToken,
      },
    });

    expect(service.generateTokens).toHaveBeenCalledWith(mockUser.sub, mockUser.email);
    expect(service.createSession).toHaveBeenCalledWith(
      mockUser.sub,
      result.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
  });
});
