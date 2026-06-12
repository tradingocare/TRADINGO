import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockOrg = { id: 'org-1', name: 'Test Org', slug: 'test-org', createdBy: 'user-1', deletedAt: null };

  beforeEach(async () => {
    prisma = {
      organization: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      organizationMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      organizationInvitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create an organization and add creator as owner', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({ ...mockOrg, members: [{ userId: 'user-1', role: 'OWNER' }], _count: { members: 1, companies: 0 } });

      const result = await service.create({ name: 'Test Org' }, 'user-1');
      expect(result.name).toBe('Test Org');
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Org',
            createdBy: 'user-1',
            members: { create: { userId: 'user-1', role: 'OWNER', invitedBy: 'user-1' } },
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE_ORGANIZATION' }) }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'existing-org' });
      await expect(service.create({ name: 'Test Org', slug: 'existing-org' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return organizations the user is a member of', async () => {
      prisma.organization.findMany.mockResolvedValue([{ ...mockOrg, members: [{ userId: 'user-1', role: 'OWNER' }], _count: { members: 1, companies: 0 } }]);
      prisma.organization.count.mockResolvedValue(1);

      const result = await service.findAll('user-1', {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            members: { some: { userId: 'user-1' } },
          }),
        }),
      );
    });

    it('should filter by search', async () => {
      prisma.organization.findMany.mockResolvedValue([mockOrg]);
      prisma.organization.count.mockResolvedValue(1);

      await service.findAll('user-1', { search: 'Test' });
      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Test', mode: 'insensitive' } },
              { slug: { contains: 'Test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return organization if user is a member', async () => {
      prisma.organization.findFirst.mockResolvedValue({ ...mockOrg, members: [{ userId: 'user-1', role: 'MEMBER' }], _count: { members: 1, companies: 0 } });
      const result = await service.findById('org-1', 'user-1');
      expect(result.id).toBe('org-1');
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.findById('org-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      prisma.organization.findFirst.mockResolvedValue({ ...mockOrg, members: [{ userId: 'user-2', role: 'MEMBER' }], _count: { members: 1, companies: 0 } });
      await expect(service.findById('org-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update organization for owners', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      prisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'Updated Org', description: 'New desc' });

      const result = await service.update('org-1', { name: 'Updated Org', description: 'New desc' }, 'user-1');
      expect(result.name).toBe('Updated Org');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if organization not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.update('org-1', { name: 'Updated' }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-admin members', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.update('org-1', { name: 'Updated' }, 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete organization for owners', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      await service.remove('org-1', 'user-1');
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not an owner', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.remove('org-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMembers', () => {
    it('should return members for authorized users', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      prisma.organizationMember.findMany.mockResolvedValue([{ id: 'm-1', userId: 'user-2', role: 'MEMBER' }]);

      const result = await service.getMembers('org-1', 'user-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if org not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.getMembers('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized users', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      await expect(service.getMembers('org-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteMember', () => {
    it('should create an invitation', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'invitee@test.com', name: 'Invitee' });
      prisma.organizationInvitation.findFirst.mockResolvedValue(null);
      prisma.organizationInvitation.create.mockResolvedValue({ id: 'inv-1', email: 'invitee@test.com', token: 'abc', status: 'PENDING' });

      const result = await service.inviteMember('org-1', { email: 'invitee@test.com' }, 'user-1');
      expect(result.email).toBe('invitee@test.com');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if invitee email not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.inviteMember('org-1', { email: 'unknown@test.com' }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'm-1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'existing@test.com' });

      await expect(service.inviteMember('org-1', { email: 'existing@test.com' }, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if invitation already pending', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'pending@test.com' });
      prisma.organizationInvitation.findFirst.mockResolvedValue({ id: 'inv-1' });

      await expect(service.inviteMember('org-1', { email: 'pending@test.com' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create membership', async () => {
      prisma.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv-1', token: 'abc', status: 'PENDING',
        organizationId: 'org-1', email: 'test@test.com', role: 'MEMBER',
        invitedBy: 'user-2', expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Test Org', deletedAt: null },
      });

      const result = await service.acceptInvitation('abc', 'user-1');
      expect(result.organizationId).toBe('org-1');
      expect(prisma.organizationMember.create).toHaveBeenCalled();
      expect(prisma.organizationInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACCEPTED' } }),
      );
    });

    it('should throw ConflictException for expired invitation', async () => {
      prisma.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv-1', token: 'abc', status: 'PENDING',
        organizationId: 'org-1', email: 'test@test.com', role: 'MEMBER',
        invitedBy: 'user-2', expiresAt: new Date(Date.now() - 86400000),
        organization: { id: 'org-1', name: 'Test Org', deletedAt: null },
      });
      await expect(service.acceptInvitation('abc', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for deleted organization', async () => {
      prisma.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv-1', token: 'abc', status: 'PENDING',
        organizationId: 'org-1', role: 'MEMBER',
        invitedBy: 'user-2', expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1', name: 'Deleted Org', deletedAt: new Date() },
      });
      await expect(service.acceptInvitation('abc', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectInvitation', () => {
    it('should reject a pending invitation', async () => {
      prisma.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv-1', token: 'abc', organizationId: 'org-1', status: 'PENDING',
      });

      await service.rejectInvitation('abc', 'user-1');
      expect(prisma.organizationInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REJECTED' } }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid invitation', async () => {
      prisma.organizationInvitation.findUnique.mockResolvedValue(null);
      await expect(service.rejectInvitation('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'm-1', userId: 'user-2', role: 'MEMBER' });

      await service.removeMember('org-1', 'm-1', 'user-1');
      expect(prisma.organizationMember.delete).toHaveBeenCalledWith({ where: { id: 'm-1' } });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if org not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.removeMember('nonexistent', 'm-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce(null);
      await expect(service.removeMember('org-1', 'nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if last owner', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'm-1', userId: 'user-2', role: 'OWNER' });
      prisma.organizationMember.count.mockResolvedValue(1);

      await expect(service.removeMember('org-1', 'm-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership to another member', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'member-2', role: 'MEMBER' });

      await service.transferOwnership('org-1', 'user-2', 'user-1');
      expect(prisma.organizationMember.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: 'OWNER' } }),
      );
    });

    it('should throw NotFoundException if new owner is not a member', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce(null);
      await expect(service.transferOwnership('org-1', 'user-2', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations for authorized members', async () => {
      prisma.organization.findFirst.mockResolvedValue(mockOrg);
      prisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      prisma.organizationInvitation.findMany.mockResolvedValue([{ id: 'inv-1', email: 'test@test.com', status: 'PENDING' }]);

      const result = await service.getPendingInvitations('org-1', 'user-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if org not found', async () => {
      prisma.organization.findFirst.mockResolvedValue(null);
      await expect(service.getPendingInvitations('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserInvitations', () => {
    it('should return pending invitations for the user email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      prisma.organizationInvitation.findMany.mockResolvedValue([
        { id: 'inv-1', organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' }, status: 'PENDING' },
      ]);

      const result = await service.getUserInvitations('user-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserInvitations('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
