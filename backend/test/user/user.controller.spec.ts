import { ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { createFakeJwtPayload } from 'src/common/utils/fake-user';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';

describe('AuthService', () => {
  let controller: UserController;
  let authService: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        PrismaService,
        AuthService,
        UserService,
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('mockToken') } },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    authService = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('GET /users/me', () => {
    it('should return user profile if user exists', async () => {
      const userId = 'user-id';

      const mockUser = {
        id: userId,
        email: 'user-get-test@example.com',
        createdAt: new Date('2025-07-21T04:33:51.154Z'),
      };

      // Simule la réponse de Prisma
      prisma.user.findUnique = jest.fn().mockResolvedValueOnce(mockUser);

      const result = await controller.getMe(createFakeJwtPayload({ userId }));

      expect(result).toMatchObject({
        id: userId,
        email: 'user-get-test@example.com',
      });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        controller.getMe(createFakeJwtPayload({ userId: 'missing-id' })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update email only', async () => {
      const userId = 'user-id';
      const updateDto = { email: 'new@example.com' };

      const updatedUser = {
        id: userId,
        email: updateDto.email,
        createdAt: new Date(),
      };

      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await controller.updateUser(createFakeJwtPayload({ userId }), updateDto);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: updateDto.email },
      });
    });

    it('should update email and hashed password', async () => {
      const userId = 'user-id';
      const updateDto = {
        email: 'new@example.com',
        password: 'newpassword123',
      };

      const hashedPassword = 'hashed-password';

      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      authService.hashPassword = jest.fn().mockResolvedValue(hashedPassword);

      const updatedUser = {
        id: userId,
        email: updateDto.email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      prisma.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await controller.updateUser(createFakeJwtPayload({ userId }), updateDto);

      expect(result).toEqual(updatedUser);
      expect(authService.hashPassword).toHaveBeenCalledWith(updateDto.password);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: updateDto.email,
          password: hashedPassword,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: 'other-user' });

      const updateDto = { email: 'taken@example.com' };

      await expect(
        controller.updateUser(createFakeJwtPayload({ userId: 'user-id' }), updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('DELETE /users/me', () => {
    it('should delete user if exists', async () => {
      const userId = 'user-id';
      prisma.user.findUnique = jest.fn().mockResolvedValue({ id: userId });
      prisma.user.delete = jest.fn().mockResolvedValue({ id: userId });

      const result = await controller.deleteUser(createFakeJwtPayload({ userId }));

      expect(result).toEqual({ message: 'User deleted' });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        controller.deleteUser(createFakeJwtPayload({ userId: 'not-found' })),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
