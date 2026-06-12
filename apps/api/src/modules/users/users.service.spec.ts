import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';

interface MockPrisma {
  user: Record<string, jest.Mock>;
  auditLog: Record<string, jest.Mock>;
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrisma;

  const baseUser = { id: '1', email: 'a@b.com', name: 'A', role: Role.VIEWER, permissions: ['read'], isActive: true, createdAt: new Date(), updatedAt: new Date() };
  const userSelect = { id: true, email: true, name: true, role: true, permissions: true, isActive: true, createdAt: true, updatedAt: true };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null }, take: 20 }),
      );
    });

    it('filters by role', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ role: Role.ADMIN });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ role: Role.ADMIN }) }),
      );
    });

    it('filters by search', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ search: 'test' });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { email: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('filters by createdAfter', async () => {
      prisma.user.findMany.mockResolvedValue([baseUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ createdAfter: '2024-01-01T00:00:00Z' });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date('2024-01-01T00:00:00Z') },
          }),
        }),
      );
    });

    it('applies cursor pagination', async () => {
      prisma.user.findMany.mockResolvedValue([{ ...baseUser, id: '2' }]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.findAll({ cursor: '1', limit: 1 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: '1' }, skip: 1 }),
      );
      expect(result.meta.cursor).toBe('2');
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      const result = await service.findById('1');
      expect(result.id).toBe('1');
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: '1', deletedAt: null }, select: userSelect }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const result = await service.findByEmail('a@b.com');
      expect(result.email).toBe('a@b.com');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findByEmail('unknown@test.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates user when requester is same user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', role: Role.VIEWER });
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, deletedAt: null });
      prisma.user.update.mockResolvedValue({ ...baseUser, name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' }, '1');
      expect(result.name).toBe('Updated');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'UPDATE_USER' }) }),
      );
    });

    it('updates user when requester is admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, deletedAt: null });
      prisma.user.update.mockResolvedValue({ ...baseUser, name: 'Admin Updated' });

      const result = await service.update('1', { name: 'Admin Updated' }, 'admin-1');
      expect(result.name).toBe('Admin Updated');
    });

    it('throws NotFoundException when target not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', role: Role.ADMIN });
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'New' }, '1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for unauthorized requester', async () => {
      const requester = { id: 'requester-1', role: Role.VIEWER };
      const target = { id: 'target-1', deletedAt: null };

      prisma.user.findUnique.mockResolvedValue(requester);
      prisma.user.findFirst.mockResolvedValue(target);

      await expect(
        service.update('target-1', { name: 'New' }, 'requester-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateRole', () => {
    it('updates user role', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, deletedAt: null });
      prisma.user.update.mockResolvedValue({ ...baseUser, role: Role.ADMIN });

      const result = await service.updateRole('1', Role.ADMIN, 'admin-1');
      expect(result.role).toBe(Role.ADMIN);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'UPDATE_USER_ROLE' }) }),
      );
    });

    it('throws NotFoundException when user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.updateRole('nonexistent', Role.ADMIN, 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and writes AuditLog', async () => {
      const user = { id: 'user-1', deletedAt: null };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({ ...user, deletedAt: new Date() });

      await service.softDelete('user-1', 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'DELETE_USER' }) }),
      );
    });

    it('throws NotFoundException for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.softDelete('nonexistent', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });
});
