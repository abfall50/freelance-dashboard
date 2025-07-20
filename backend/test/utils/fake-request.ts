import { Request } from 'express';

export const createFakeRequest = (
  token = 'mockToken',
  ip = '127.0.0.1',
  ua = 'jest-agent',
): Request =>
  ({
    ip,
    headers: { 'user-agent': ua, authorization: `Bearer ${token}` },
  }) as unknown as Request;
