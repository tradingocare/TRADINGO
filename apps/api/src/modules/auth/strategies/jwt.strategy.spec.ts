import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    strategy = new JwtStrategy(
      { get: jest.fn((key: string) => key === 'jwt.secret' ? 'test-secret' : undefined) } as any,
      prisma as any,
    );
  });

  describe('validate', () => {
    it('should return payload if user is active', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: false });
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
