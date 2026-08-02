import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };
  let redis: { get: jest.Mock; set: jest.Mock };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    strategy = new JwtStrategy(
      { get: jest.fn((key: string) => key === 'jwt.secret' ? 'test-secret' : undefined) } as any,
      prisma as any,
      redis as any,
    );
  });

  describe('validate', () => {
    it('should return payload if user is active', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual(payload);
      expect(redis.set).toHaveBeenCalledWith('user:active:user-1', 'true', 300);
    });

    it('should return payload from cache if previously verified active', async () => {
      redis.get.mockResolvedValue('true');
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual(payload);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if cached as inactive', async () => {
      redis.get.mockResolvedValue('false');
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
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
      expect(redis.set).toHaveBeenCalledWith('user:active:user-1', 'false', 300);
    });
  });
});
