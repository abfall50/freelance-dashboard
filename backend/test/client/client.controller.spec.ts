import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from 'src/client/client.controller';
import { ClientService } from 'src/client/client.service';
import { createFakeJwtPayload } from 'src/common/utils/fake-user';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ClientController', () => {
  let controller: ClientController;
  let service: ClientService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [ClientService, PrismaService],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('GET /clients', () => {
    it('should return all the clients for the authenticated user', async () => {
      const userId = 'user-id';

      const mockClients = [
        { id: 'client-a', name: 'Client A', email: 'client-a@example.com', company: 'A Inc' },
        { id: 'client-b', name: 'Client B', email: 'client-b@example.com', company: 'B Ltd' },
      ];

      service.findAll = jest.fn().mockResolvedValue(mockClients);

      const result = await controller.findAll(createFakeJwtPayload({ userId }));

      expect(service.findAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockClients);
    });
  });

  describe('POST /clients', () => {
    it('should create a new client for the authencated user', async () => {
      const userId = 'user-id';

      const createDto = {
        name: 'New Client',
        email: 'new-client-unit-test@example.com',
        company: 'Unit Test Comapny',
      };

      const createdClient = {
        id: 'created-client-id',
        ...createDto,
      };

      service.create = jest.fn().mockResolvedValue(createdClient);

      const result = await controller.create(createFakeJwtPayload({ userId }), createDto);

      expect(service.create).toHaveBeenCalledWith(userId, createDto);
      expect(result).toEqual(createdClient);
    });
  });

  describe('GET /client/:id', () => {
    it('should return a client if it belongs to the user', async () => {
      const userId = 'user-id';
      const clientId = 'client-id';

      const mockUser = createFakeJwtPayload({ userId });
      const mockClient = {
        id: clientId,
        name: 'X Client',
        email: 'x-client@example.com',
        company: 'X & co',
      };

      service.findOne = jest.fn().mockResolvedValueOnce(mockClient);

      const result = await controller.findOne(mockUser, { id: clientId });

      expect(service.findOne).toHaveBeenCalledWith(userId, clientId);
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client does not exist or is not owned by user', async () => {
      const userId = 'user-id';
      const clientId = 'non-existent-client';

      const mockUser = createFakeJwtPayload({ userId });

      service.findOne = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.findOne(mockUser, { id: clientId })).rejects.toThrow(
        'Client not found',
      );
    });
  });

  describe('PATCH /clients/:id', () => {
    it('should update a client if it belongs to the user', async () => {
      const userId = 'user-id';
      const clientId = 'client-id';

      const mockUser = createFakeJwtPayload({ userId });

      const updateDto = {
        name: 'Updated Client',
        email: 'update-email.example.com',
        company: 'Updated Company',
      };

      const updatedClient = {
        id: clientId,
        name: 'Updated Client',
        email: 'client@example.com',
        company: 'Updated Company',
      };

      service.update = jest.fn().mockResolvedValueOnce(updatedClient);

      const result = await controller.update(mockUser, { id: clientId }, updateDto);

      expect(service.update).toHaveBeenCalledWith(userId, clientId, updateDto);
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException if client does not exist or is not owned by user', async () => {
      const userId = 'user-id';
      const clientId = 'non-existent-client';
      const updateDto = { name: 'Anything' };

      const mockUser = createFakeJwtPayload({ userId });

      service.update = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.update(mockUser, { id: clientId }, updateDto)).rejects.toThrow(
        'Client not found',
      );
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete a client if it belongs to the user', async () => {
      const userId = 'user-id';
      const clientId = 'client-id';

      const mockUser = createFakeJwtPayload({ userId });

      service.delete = jest.fn().mockResolvedValueOnce({ id: clientId });

      const result = await controller.remove(mockUser, { id: clientId });

      expect(service.delete).toHaveBeenCalledWith(userId, clientId);
      expect(result).toEqual({ id: clientId });
    });

    it('should throw NotFoundException if client does not exist or is not owned by user', async () => {
      const userId = 'user-id';
      const clientId = 'invalid-id';

      const mockUser = createFakeJwtPayload({ userId });

      service.delete = jest.fn().mockResolvedValueOnce(null);

      await expect(controller.remove(mockUser, { id: clientId })).rejects.toThrow(
        'Client not found',
      );
    });
  });
});
