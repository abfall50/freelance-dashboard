import { Test, TestingModule } from '@nestjs/testing';
import { MissionController } from 'src/mission/mission.controller';
import { MissionService } from 'src/mission/mission.service';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { createFakeJwtPayload } from 'src/common/utils/fake-user';
import { CreateMissionDto } from 'src/mission/dto/create-mission.dto';
import { PrismaService } from 'src/prisma/prisma.service';

describe('MissionController', () => {
  let controller: MissionController;
  let service: MissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionController],
      providers: [MissionService, PrismaService],
    }).compile();

    controller = module.get<MissionController>(MissionController);
    service = module.get<MissionService>(MissionService);
  });

  describe('GET /missions', () => {
    it('should return all missions for the authenticated user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const mockMissions = [
        {
          id: 'mission1',
          title: 'Mission A',
          amount: 1000,
          status: 'PAID',
          date: new Date(),
        },
        {
          id: 'mission2',
          title: 'Mission B',
          amount: 500,
          status: 'PENDING',
          date: new Date(),
        },
      ];

      service.findAll = jest.fn().mockResolvedValueOnce(mockMissions);

      const result = await controller.findAll(user);

      expect(service.findAll).toHaveBeenCalledWith(user.userId);
      expect(result).toEqual(mockMissions);
    });
  });

  describe('POST /missions', () => {
    it('should create a new mission for the authenticated user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const createDto: CreateMissionDto = {
        title: 'Nouvelle mission',
        amount: 1200,
        status: 'PENDING',
        date: new Date().toISOString(),
        clientId: 'client-id',
      };

      const createdMission = {
        id: 'mission-id',
        ...createDto,
      };

      service.create = jest.fn().mockResolvedValueOnce(createdMission);

      const result = await controller.create(user, createDto);

      expect(service.create).toHaveBeenCalledWith(user.userId, createDto);
      expect(result).toEqual(createdMission);
    });
  });

  describe('GET /missions/:id', () => {
    it('should return the mission if it belongs to the user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const missionId = 'mission-id';

      const mockMission = {
        id: missionId,
        title: 'Mission A',
        amount: 1500,
        status: 'PAID',
        date: new Date(),
        clientId: 'client-id',
      };

      service.findOne = jest.fn().mockResolvedValueOnce(mockMission);

      const result = await controller.findOne(user, { id: missionId });

      expect(service.findOne).toHaveBeenCalledWith(user.userId, missionId);
      expect(result).toEqual(mockMission);
    });

    it('should throw NotFoundException if mission does not exist or is not owned by user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const missionId = 'non-existent-id';

      service.findOne = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.findOne(user, { id: missionId })).rejects.toThrow(
        'Mission not found',
      );
    });
  });

  describe('PATCH /missions/:id', () => {
    it('should update the mission if it belongs to the user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const missionId = 'mission-id';
      const updateDto = {
        title: 'Updated title',
        amount: 2000,
      };

      const updatedMission = {
        id: missionId,
        title: 'Updated title',
        amount: 2000,
        status: 'PENDING',
        date: new Date(),
        clientId: 'client-id',
      };

      service.update = jest.fn().mockResolvedValueOnce(updatedMission);

      const result = await controller.update(user, { id: missionId }, updateDto);

      expect(service.update).toHaveBeenCalledWith(user.userId, missionId, updateDto);
      expect(result).toEqual(updatedMission);
    });

    it('should throw NotFoundException if mission does not exist or is not owned by user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const missionId = 'invalid-id';
      const updateDto = { title: 'New title' };

      service.update = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.update(user, { id: missionId }, updateDto)).rejects.toThrow(
        'Mission not found',
      );
    });
  });

  describe('DELETE /missions/:id', () => {
    it('should delete the mission if it belongs to the user', async () => {
      const user: JwtPayload = createFakeJwtPayload();

      const missionId = 'mission-id';

      const deleted = { id: missionId };

      service.delete = jest.fn().mockResolvedValueOnce(deleted);

      const result = await controller.remove(user, { id: missionId });

      expect(service.delete).toHaveBeenCalledWith(user.userId, missionId);
      expect(result).toEqual(deleted);
    });

    it('should throw NotFoundException if mission does not exist or is not owned by user', async () => {
      const user: JwtPayload = {
        userId: 'user-id',
        email: 'test@example.com',
      };

      const missionId = 'invalid-id';

      service.delete = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.remove(user, { id: missionId })).rejects.toThrow('Mission not found');
    });
  });
});
