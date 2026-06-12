import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const mockPrisma = {
  organization: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  organizationMember: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn(), update: jest.fn() },
  organizationInvitation: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-uuid') }));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('mock-invite-token') }),
}));

describe('Organization Flow Integration', () => {
  let controller: OrganizationsController;
  let service: OrganizationsService;

  const mockUser = { sub: 'user-1' };

  function resetMocks() {
    jest.clearAllMocks();
    mockPrisma.organization.findUnique.mockResolvedValue(null);
    mockPrisma.organization.findFirst.mockResolvedValue(null);
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
    mockPrisma.organizationInvitation.findUnique.mockResolvedValue(null);
    mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null);
  }

  beforeEach(async () => {
    resetMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  describe('Create Organization Flow', () => {
    const dto = { name: 'Test Org', description: 'A test organization', email: 'org@test.com' };
    const createdOrg = {
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      description: 'A test organization',
      email: 'org@test.com',
      createdBy: 'user-1',
      updatedBy: 'user-1',
      members: [{ userId: 'user-1', role: 'OWNER', invitedBy: 'user-1', user: { id: 'user-1', email: 'user@test.com', name: 'Test' } }],
      _count: { members: 1, companies: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('creates organization successfully', async () => {
      mockPrisma.organization.create.mockResolvedValue(createdOrg);

      const result = await controller.create(dto, mockUser.sub);

      expect(result.name).toBe('Test Org');
      expect(result.slug).toBe('test-org');
      expect(mockPrisma.organization.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ name: 'Test Org', createdBy: 'user-1' }),
      }));
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'CREATE_ORGANIZATION' }),
      }));
    });

    it('rejects duplicate slug', async () => {
      mockPrisma.organization.findUnique.mockResolvedValueOnce({ id: 'existing' });
      mockPrisma.organization.create.mockRejectedValue(new (require('@nestjs/common').ConflictException)('Organization slug already exists'));

      await expect(controller.create(dto, mockUser.sub)).rejects.toThrow('Organization slug already exists');
    });
  });

  describe('Find Organizations Flow', () => {
    const orgs = [
      { id: 'org-1', name: 'Org A', slug: 'org-a', members: [], _count: { members: 1, companies: 0 }, createdAt: new Date(), updatedAt: new Date() },
      { id: 'org-2', name: 'Org B', slug: 'org-b', members: [], _count: { members: 2, companies: 1 }, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('lists organizations with pagination', async () => {
      mockPrisma.organization.findMany.mockResolvedValue(orgs);
      mockPrisma.organization.count.mockResolvedValue(2);

      const result = await controller.findAll(mockUser.sub, { limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('supports cursor-based pagination', async () => {
      mockPrisma.organization.findMany.mockResolvedValue(orgs);
      mockPrisma.organization.count.mockResolvedValue(2);

      const result = await controller.findAll(mockUser.sub, { cursor: 'org-1', limit: 1 });

      expect(result.meta.cursor).toBe('org-2');
    });

    it('filters by search term', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([orgs[0]]);
      mockPrisma.organization.count.mockResolvedValue(1);

      await controller.findAll(mockUser.sub, { search: 'Org A' });

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Org A' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('Get Organization Flow', () => {
    const org = {
      id: 'org-1', name: 'Test Org', slug: 'test-org',
      members: [{ userId: 'user-1', role: 'OWNER', user: { id: 'user-1', email: 'u@t.com', name: 'U', role: 'USER' } }],
      _count: { members: 1, companies: 0 },
      createdAt: new Date(), updatedAt: new Date(),
    };

    it('finds organization by ID when user is member', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(org);

      const result = await controller.findOne('org-1', mockUser.sub);

      expect(result.id).toBe('org-1');
    });

    it('throws when organization not found', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await expect(controller.findOne('org-404', mockUser.sub)).rejects.toThrow('Organization not found');
    });

    it('throws when user is not a member', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({
        ...org, members: [{ userId: 'other-user', role: 'MEMBER' }],
      });

      await expect(controller.findOne('org-1', 'non-member')).rejects.toThrow('You are not a member');
    });
  });

  describe('Update Organization Flow', () => {
    it('updates organization with valid role', async () => {
      mockPrisma.organization.findFirst.mockResolvedValueOnce({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      mockPrisma.organization.update.mockResolvedValue({ id: 'org-1', name: 'Updated' });

      const result = await controller.update('org-1', { name: 'Updated' }, mockUser.sub);

      expect(result.name).toBe('Updated');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('throws when not owner/admin', async () => {
      mockPrisma.organization.findFirst.mockResolvedValueOnce({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(controller.update('org-1', { name: 'Updated' }, mockUser.sub))
        .rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Delete Organization Flow', () => {
    it('soft deletes organization', async () => {
      mockPrisma.organization.findFirst.mockResolvedValueOnce({ id: 'org-1', createdBy: 'user-1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });

      await controller.remove('org-1', mockUser.sub);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }));
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Member Management Flow', () => {
    const inviter = { sub: 'user-1' };
    const inviteDto = { email: 'new@test.com', role: 'MEMBER' as const };

    it('invites member successfully', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2', name: 'New User' });
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce(null);
      mockPrisma.organizationInvitation.findFirst.mockResolvedValue(null);
      mockPrisma.organizationInvitation.create.mockResolvedValue({ id: 'invite-1', email: 'new@test.com', role: 'MEMBER', token: 'mock-invite-token', expiresAt: new Date(), organizationId: 'org-1', invitedBy: 'user-1' });

      const result = await controller.inviteMember('org-1', inviteDto, inviter.sub);

      expect(result.email).toBe('new@test.com');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('accepts invitation', async () => {
      const invitation = {
        id: 'invite-1', status: 'PENDING', role: 'MEMBER',
        organizationId: 'org-1', invitedBy: 'user-1',
        organization: { id: 'org-1', name: 'Test Org', deletedAt: null },
        expiresAt: new Date(Date.now() + 86400000),
        token: 'mock-invite-token',
      };
      mockPrisma.organizationInvitation.findUnique.mockResolvedValue(invitation);
      mockPrisma.organizationMember.create.mockResolvedValue({ id: 'member-1' });
      mockPrisma.organizationInvitation.update.mockResolvedValue({ ...invitation, status: 'ACCEPTED' });

      const result = await controller.acceptInvitation('mock-invite-token', 'user-2');

      expect(result.organizationId).toBe('org-1');
      expect(result.organizationName).toBe('Test Org');
    });

    it('rejects expired invitation', async () => {
      mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
        status: 'PENDING',
        organization: { deletedAt: null },
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(controller.acceptInvitation('expired', 'user-2'))
        .rejects.toThrow('Invitation has expired');
    });

    it('rejects invitation for deleted org', async () => {
      mockPrisma.organizationInvitation.findUnique.mockResolvedValue({
        status: 'PENDING',
        organization: { deletedAt: new Date() },
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(controller.acceptInvitation('deleted-org', 'user-2'))
        .rejects.toThrow('Organization no longer exists');
    });

    it('removes member', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'member-1', userId: 'user-2', role: 'MEMBER' });
      mockPrisma.organizationMember.count.mockResolvedValue(2);
      mockPrisma.organizationMember.delete.mockResolvedValue({});

      await controller.removeMember('org-1', 'member-1', mockUser.sub);

      expect(mockPrisma.organizationMember.delete).toHaveBeenCalled();
    });

    it('prevents removing last owner', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'member-1', userId: 'user-2', role: 'OWNER' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);

      await expect(controller.removeMember('org-1', 'member-1', mockUser.sub))
        .rejects.toThrow('Cannot remove the last owner');
    });

    it('transfers ownership', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ role: 'OWNER' })
        .mockResolvedValueOnce({ id: 'member-2', role: 'MEMBER' });

      await controller.transferOwnership('org-1', 'user-2', mockUser.sub);

      expect(mockPrisma.organizationMember.update).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: 'OWNER' },
      });
    });
  });

  describe('Get Members Flow', () => {
    it('returns members for authorized user', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        { id: 'm1', userId: 'u1', role: 'OWNER', user: { id: 'u1', email: 'u1@t.com', name: 'U1', role: 'USER', isActive: true }, joinedAt: new Date(), organizationId: 'org-1', invitedBy: 'u1' },
      ]);

      const result = await controller.getMembers('org-1', mockUser.sub);

      expect(result).toHaveLength(1);
    });
  });

  describe('Invitations Flow', () => {
    it('lists pending invitations for org', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      mockPrisma.organizationInvitation.findMany.mockResolvedValue([
        { id: 'i1', email: 'invited@t.com', role: 'MEMBER', status: 'PENDING', organizationId: 'org-1', token: 't1', expiresAt: new Date(), createdAt: new Date(), invitedBy: 'u1', inviter: { id: 'u1', email: 'u1@t.com', name: 'U1' } },
      ]);

      const result = await controller.getInvitations('org-1', mockUser.sub);

      expect(result).toHaveLength(1);
    });

    it('lists user pending invitations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@t.com' });
      mockPrisma.organizationInvitation.findMany.mockResolvedValue([
        { id: 'i1', email: 'user@t.com', role: 'MEMBER', status: 'PENDING', organization: { id: 'o1', name: 'Org', slug: 'org', logo: null }, createdAt: new Date(), expiresAt: new Date(), organizationId: 'o1', token: 't1', invitedBy: 'u1' },
      ]);

      const result = await controller.getMyInvitations(mockUser.sub);

      expect(result).toHaveLength(1);
    });
  });

  describe('Reject Invitation Flow', () => {
    it('rejects invitation successfully', async () => {
      mockPrisma.organizationInvitation.findUnique.mockResolvedValue({ id: 'i1', organizationId: 'org-1', status: 'PENDING' });

      await controller.rejectInvitation('token', mockUser.sub);

      expect(mockPrisma.organizationInvitation.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { status: 'REJECTED' },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
