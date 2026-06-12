import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: Record<string, jest.Mock>;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getMembers: jest.fn(),
      inviteMember: jest.fn(),
      removeMember: jest.fn(),
      transferOwnership: jest.fn(),
      getPendingInvitations: jest.fn(),
      getUserInvitations: jest.fn(),
      acceptInvitation: jest.fn(),
      rejectInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', name: 'Org' });
    const result = await controller.create({ name: 'Org' } as any, 'user-1');
    expect(result.name).toBe('Org');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll('user-1', {});
    expect(result.meta.total).toBe(0);
  });

  it('should getMyInvitations', async () => {
    service.getUserInvitations.mockResolvedValue([]);
    const result = await controller.getMyInvitations('user-1');
    expect(result).toEqual([]);
  });

  it('should findOne', async () => {
    service.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1', 'user-1');
    expect(result.id).toBe('1');
  });

  it('should update', async () => {
    service.update.mockResolvedValue({ id: '1', name: 'Updated' });
    const result = await controller.update('1', { name: 'Updated' } as any, 'user-1');
    expect(result.name).toBe('Updated');
  });

  it('should remove', async () => {
    await controller.remove('1', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
  });

  it('should getMembers', async () => {
    service.getMembers.mockResolvedValue([]);
    const result = await controller.getMembers('1', 'user-1');
    expect(result).toEqual([]);
  });

  it('should inviteMember', async () => {
    service.inviteMember.mockResolvedValue({ id: 'inv-1', email: 'test@test.com' });
    const result = await controller.inviteMember('1', { email: 'test@test.com' } as any, 'user-1');
    expect(result.email).toBe('test@test.com');
  });

  it('should removeMember', async () => {
    await controller.removeMember('1', 'm-1', 'user-1');
    expect(service.removeMember).toHaveBeenCalledWith('1', 'm-1', 'user-1');
  });

  it('should transferOwnership', async () => {
    service.transferOwnership.mockResolvedValue(undefined);
    await controller.transferOwnership('1', 'user-2', 'user-1');
    expect(service.transferOwnership).toHaveBeenCalledWith('1', 'user-2', 'user-1');
  });

  it('should getInvitations', async () => {
    service.getPendingInvitations.mockResolvedValue([]);
    const result = await controller.getInvitations('1', 'user-1');
    expect(result).toEqual([]);
  });

  it('should acceptInvitation', async () => {
    service.acceptInvitation.mockResolvedValue({ organizationId: '1', organizationName: 'Org' });
    const result = await controller.acceptInvitation('token-123', 'user-1');
    expect(result.organizationId).toBe('1');
  });

  it('should rejectInvitation', async () => {
    await controller.rejectInvitation('token-123', 'user-1');
    expect(service.rejectInvitation).toHaveBeenCalledWith('token-123', 'user-1');
  });
});
