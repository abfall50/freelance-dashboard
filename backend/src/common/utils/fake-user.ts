import { JwtPayload } from '../types/jwt-payload.type';

export const createFakeJwtPayload = (overrides: Partial<JwtPayload> = {}) => ({
  userId: 'user-id',
  email: 'fake-user-email@example.com',
  ...overrides,
});
