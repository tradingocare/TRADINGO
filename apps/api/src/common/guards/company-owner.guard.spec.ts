import { CompanyOwnerGuard } from './company-owner.guard';
import { ForbiddenException } from '@nestjs/common';

describe('CompanyOwnerGuard', () => {
  let guard: CompanyOwnerGuard;
  let prisma: { companyOwner: { findUnique: jest.Mock } };
  let request: { params: Record<string, string>; user: { sub: string; role: string } | null };

  function mockContext() {
    return {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })),
    };
  }

  beforeEach(() => {
    prisma = { companyOwner: { findUnique: jest.fn() } };
    guard = new CompanyOwnerGuard(prisma as any);
    request = { params: { companyId: 'company-1' }, user: { sub: 'user-1', role: 'USER' } };
  });

  describe('canActivate', () => {
    it('should return true for company owner', async () => {
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });

      const result = await guard.canActivate(mockContext() as any);

      expect(result).toBe(true);
      expect(prisma.companyOwner.findUnique).toHaveBeenCalledWith({
        where: { companyId_userId: { companyId: 'company-1', userId: 'user-1' } },
        select: { id: true },
      });
    });

    it('should return true for Super Admin without ownership check', async () => {
      request.user = { sub: 'admin-1', role: 'SUPER_ADMIN' };

      const result = await guard.canActivate(mockContext() as any);

      expect(result).toBe(true);
      expect(prisma.companyOwner.findUnique).not.toHaveBeenCalled();
    });

    it('should return true for Admin without ownership check', async () => {
      request.user = { sub: 'admin-1', role: 'ADMIN' };

      const result = await guard.canActivate(mockContext() as any);

      expect(result).toBe(true);
      expect(prisma.companyOwner.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      prisma.companyOwner.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext() as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user context', async () => {
      request.user = null;

      await expect(guard.canActivate(mockContext() as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when company ID missing from params', async () => {
      request.params = {};

      await expect(guard.canActivate(mockContext() as any)).rejects.toThrow(ForbiddenException);
    });

    it('should also match params.id for company ID lookup', async () => {
      request.params = { id: 'company-1' };
      request.user = { sub: 'user-1', role: 'USER' };
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });

      const result = await guard.canActivate(mockContext() as any);

      expect(result).toBe(true);
      expect(prisma.companyOwner.findUnique).toHaveBeenCalledWith({
        where: { companyId_userId: { companyId: 'company-1', userId: 'user-1' } },
        select: { id: true },
      });
    });
  });
});
