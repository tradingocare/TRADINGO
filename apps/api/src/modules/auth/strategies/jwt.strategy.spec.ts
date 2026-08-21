import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: {
    user: { findUnique: jest.Mock };
    companyOwner: { findFirst: jest.Mock };
  };
  let redis: { get: jest.Mock; set: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      companyOwner: { findFirst: jest.fn() },
    };
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    strategy = new JwtStrategy(
      { get: jest.fn((key: string) => (key === 'jwt.secret' ? 'test-secret' : undefined)) } as any,
      prisma as any,
      redis as any,
    );
  });

  describe('validate', () => {
    it('should return payload with companyId if user is active', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      prisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'comp-1' });
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual({ ...payload, companyId: 'comp-1' });
      expect(redis.set).toHaveBeenCalledWith('user:active:user-1', 'true', 300);
      expect(redis.set).toHaveBeenCalledWith('user:company:user-1', 'comp-1', 300);
    });

    it('should return payload from cache if previously verified active with company', async () => {
      redis.get.mockImplementation((key: string) =>
        key === 'user:active:user-1' ? 'true' : key === 'user:company:user-1' ? 'comp-1' : null,
      );
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual({ ...payload, companyId: 'comp-1' });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should resolve company even when only active flag is cached (login prime)', async () => {
      redis.get.mockImplementation((key: string) =>
        key === 'user:active:user-1' ? 'true' : null,
      );
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      prisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'comp-1' });
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual({ ...payload, companyId: 'comp-1' });
      expect(prisma.companyOwner.findFirst).toHaveBeenCalled();
    });

    it('should cache empty company when user has no company', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });
      prisma.companyOwner.findFirst.mockResolvedValue(null);
      const payload = { sub: 'user-1', email: 'test@test.com', role: 'VIEWER', permissions: [] };
      const result = await strategy.validate(payload);
      expect(result).toEqual({ ...payload, companyId: undefined });
      expect(redis.set).toHaveBeenCalledWith('user:company:user-1', '', 300);
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
