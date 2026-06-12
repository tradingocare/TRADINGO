import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CanActivate, ForbiddenException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Record<string, jest.Mock>;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateRole: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
      const result = await controller.findAll({});
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      service.findById.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      const result = await controller.getProfile('user-1');
      expect(result.id).toBe('user-1');
    });
  });

  describe('findOne', () => {
    it('should return user when same id', async () => {
      service.findById.mockResolvedValue({ id: 'user-1', role: 'VIEWER' });
      const result = await controller.findOne('user-1', 'user-1');
      expect(result.id).toBe('user-1');
    });

    it('should return user for admin viewing other user', async () => {
      service.findById
        .mockResolvedValueOnce({ id: 'user-1', role: 'SUPER_ADMIN' })
        .mockResolvedValueOnce({ id: 'user-2', role: 'VIEWER' });
      const result = await controller.findOne('user-2', 'user-1');
      expect(result.id).toBe('user-2');
    });

    it('should throw ForbiddenException for non-admin viewing other user', async () => {
      service.findById.mockResolvedValue({ id: 'user-1', role: 'VIEWER' });
      await expect(controller.findOne('user-2', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      service.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const result = await controller.update('1', { name: 'Updated' } as any, 'user-1');
      expect(result.name).toBe('Updated');
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      service.updateRole.mockResolvedValue({ id: '1', role: 'ADMIN' });
      const result = await controller.updateRole('1', 'ADMIN' as any, 'admin-1');
      expect(result.role).toBe('ADMIN');
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      const result = await controller.remove('1', 'admin-1');
      expect(service.softDelete).toHaveBeenCalledWith('1', 'admin-1');
      expect(result.message).toBe('User deleted successfully');
    });
  });
});
