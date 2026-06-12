import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { v4 as uuid } from 'uuid';
import { randomBytes } from 'crypto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `org-${uuid().slice(0, 8)}`;
}

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name);
    let attempt = 0;
    while (await this.prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }
    return slug;
  }

  async create(dto: CreateOrganizationDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    const existing = await this.prisma.organization.findUnique({ where: { slug }, select: { id: true } });
    if (existing) throw new ConflictException('Organization slug already exists');

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        createdBy: userId,
        updatedBy: userId,
        members: {
          create: { userId, role: 'OWNER', invitedBy: userId },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        _count: { select: { members: true, companies: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ORGANIZATION',
        resource: `organization:${organization.id}`,
        metadata: { name: dto.name, slug },
      },
    });

    this.logger.log(`Organization ${organization.id} created by ${userId}`);
    return organization;
  }

  async findAll(userId: string, query: { cursor?: string; limit?: number; search?: string }) {
    const { cursor, limit = 20, search } = query;
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      members: { some: { userId } },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    const findArgs: Prisma.OrganizationFindManyArgs = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        _count: { select: { members: true, companies: true } },
      },
    };
    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany(findArgs),
      this.prisma.organization.count({ where }),
    ]);
    return {
      data,
      meta: {
        total,
        limit,
        cursor: data.length > 0 ? data[data.length - 1].id : undefined,
      },
    };
  }

  async findById(id: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        },
        _count: { select: { members: true, companies: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const isMember = org.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this organization');

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    const org = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(id, userId, ['OWNER', 'ADMIN']);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'UPDATE_ORGANIZATION', resource: `organization:${id}`, metadata: { changes: { ...dto } } },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const org = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true, createdBy: true } });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(id, userId, ['OWNER']);

    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'DELETE_ORGANIZATION', resource: `organization:${id}` },
    });

    this.logger.log(`Organization ${id} soft-deleted by ${userId}`);
  }

  async getMembers(organizationId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(organizationId, userId, ['OWNER', 'ADMIN', 'MANAGER']);

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteMember(organizationId: string, dto: InviteMemberDto, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(organizationId, userId, ['OWNER', 'ADMIN']);

    const targetUser = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true, name: true } });
    if (!targetUser) throw new NotFoundException('User with this email not found');

    const existingMember = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUser.id } },
      select: { id: true },
    });
    if (existingMember) throw new ConflictException('User is already a member of this organization');

    const existingInvite = await this.prisma.organizationInvitation.findFirst({
      where: { organizationId, email: dto.email, status: 'PENDING' },
      select: { id: true },
    });
    if (existingInvite) throw new ConflictException('An invitation is already pending for this email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: dto.email,
        role: dto.role || 'MEMBER',
        token,
        invitedBy: userId,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'INVITE_ORGANIZATION_MEMBER',
        resource: `organization:${organizationId}`,
        metadata: { email: dto.email, role: dto.role || 'MEMBER', invitationId: invitation.id },
      },
    });

    this.logger.log(`Invitation sent to ${dto.email} for organization ${organizationId}`);
    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: { organization: { select: { id: true, name: true, deletedAt: true } } },
    });
    if (!invitation || invitation.status !== 'PENDING') throw new NotFoundException('Invalid or expired invitation');
    if (invitation.organization.deletedAt) throw new NotFoundException('Organization no longer exists');
    if (invitation.expiresAt < new Date()) throw new ConflictException('Invitation has expired');

    await this.prisma.organizationMember.create({
      data: { organizationId: invitation.organizationId, userId, role: invitation.role, invitedBy: invitation.invitedBy },
    });

    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ACCEPT_ORGANIZATION_INVITATION',
        resource: `organization:${invitation.organizationId}`,
        metadata: { invitationId: invitation.id },
      },
    });

    return { organizationId: invitation.organizationId, organizationName: invitation.organization.name };
  }

  async rejectInvitation(token: string, userId: string) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      select: { id: true, organizationId: true, status: true },
    });
    if (!invitation || invitation.status !== 'PENDING') throw new NotFoundException('Invalid or expired invitation');

    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REJECTED' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REJECT_ORGANIZATION_INVITATION',
        resource: `organization:${invitation.organizationId}`,
        metadata: { invitationId: invitation.id },
      },
    });
  }

  async removeMember(organizationId: string, memberId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(organizationId, userId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.organizationMember.findUnique({
      where: { id: memberId },
      select: { id: true, userId: true, role: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') {
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId, role: 'OWNER' },
      });
      if (ownerCount <= 1) throw new ForbiddenException('Cannot remove the last owner');
    }

    await this.prisma.organizationMember.delete({ where: { id: memberId } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REMOVE_ORGANIZATION_MEMBER',
        resource: `organization:${organizationId}`,
        metadata: { removedUserId: member.userId },
      },
    });
  }

  async transferOwnership(organizationId: string, newOwnerUserId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(organizationId, userId, ['OWNER']);

    const newOwner = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: newOwnerUserId } },
      select: { id: true, role: true },
    });
    if (!newOwner) throw new NotFoundException('User is not a member of this organization');

    await this.prisma.organizationMember.update({
      where: { id: newOwner.id },
      data: { role: 'OWNER' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'TRANSFER_ORGANIZATION_OWNERSHIP',
        resource: `organization:${organizationId}`,
        metadata: { newOwnerUserId },
      },
    });
  }

  async getPendingInvitations(organizationId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    await this.requireRole(organizationId, userId, ['OWNER', 'ADMIN', 'MANAGER']);

    return this.prisma.organizationInvitation.findMany({
      where: { organizationId, status: 'PENDING' },
      include: { inviter: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.organizationInvitation.findMany({
      where: { email: user.email, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: { organization: { select: { id: true, name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireRole(organizationId: string, userId: string, allowedRoles: string[]) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('You are not a member of this organization');
    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }
  }
}
