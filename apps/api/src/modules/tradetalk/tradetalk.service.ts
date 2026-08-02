import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityVisibility, CommunityJoinSetting, CommunityMemberRole, CommunityMemberStatus, Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TradeTalkService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Community Categories ──────────────────────────────────────────────

  async listCategories() {
    return this.prisma.communityCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number }) {
    const existing = await this.prisma.communityCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Category slug already exists');
    return this.prisma.communityCategory.create({ data });
  }

  async updateCategory(id: string, data: { name?: string; slug?: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    const cat = await this.prisma.communityCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.communityCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.communityCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.communityCategory.delete({ where: { id } });
  }

  // ─── Communities ───────────────────────────────────────────────────────

  async discoverCommunities(query: { categoryId?: string; search?: string; visibility?: CommunityVisibility; isActive?: boolean; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : { isActive: true, visibility: query.visibility || 'PUBLIC' }),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { memberCount: 'desc' }],
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getCommunity(idOrSlug: string, userId?: string) {
    const community = await this.prisma.community.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        deletedAt: null,
      },
      include: {
        category: true,
        rooms: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { members: true, rooms: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');
    if (community.visibility === 'PRIVATE') {
      if (!userId) throw new ForbiddenException('Authentication required to view private community');
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }
    return community;
  }

  async createCommunity(userId: string, data: {
    name: string; slug: string; description?: string; longDescription?: string;
    logo?: string; banner?: string; categoryId?: string;
    visibility?: CommunityVisibility; joinSetting?: CommunityJoinSetting;
    companyId?: string; rules?: string; tags?: string[];
  }) {
    const existing = await this.prisma.community.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Community slug already exists');

    const community = await this.prisma.$transaction(async (tx) => {
      const comm = await tx.community.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          longDescription: data.longDescription,
          logo: data.logo,
          banner: data.banner,
          categoryId: data.categoryId,
          visibility: data.visibility || 'PUBLIC',
          joinSetting: data.joinSetting || 'OPEN',
          ownerId: userId,
          companyId: data.companyId,
          rules: data.rules,
          tags: data.tags || [],
          memberCount: 1,
        },
      });

      await tx.communityMember.create({
        data: {
          communityId: comm.id,
          userId,
          companyId: data.companyId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      return comm;
    });

    return this.getCommunity(community.id);
  }

  async updateCommunity(idOrSlug: string, userId: string, data: {
    name?: string; slug?: string; description?: string; longDescription?: string;
    logo?: string; banner?: string; categoryId?: string;
    visibility?: CommunityVisibility; joinSetting?: CommunityJoinSetting;
    tags?: string[]; isActive?: boolean; isFeatured?: boolean;
  }) {
    const community = await this.requireCommunityAccess(idOrSlug, userId, ['OWNER', 'ADMIN']);
    return this.prisma.community.update({ where: { id: community.id }, data });
  }

  async deleteCommunity(idOrSlug: string, userId: string) {
    const community = await this.requireCommunityAccess(idOrSlug, userId, ['OWNER']);
    return this.prisma.community.update({
      where: { id: community.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ─── Membership ────────────────────────────────────────────────────────

  async joinCommunity(communityId: string, userId: string, companyId?: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community || community.deletedAt) throw new NotFoundException('Community not found');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      if (existing.status === 'ACTIVE') throw new ConflictException('Already a member');
      if (existing.status === 'BANNED') throw new ForbiddenException('You are banned from this community');
      if (existing.status === 'INACTIVE' || existing.status === 'PENDING') {
        return this.prisma.communityMember.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', joinedAt: new Date(), companyId: companyId || existing.companyId },
        });
      }
    }

    if (community.joinSetting === 'INVITE_ONLY') {
      throw new ForbiddenException('This community is invite-only');
    }

    let status: CommunityMemberStatus = 'ACTIVE';
    if (community.joinSetting === 'APPROVAL_REQUIRED') {
      status = 'PENDING';
    }

    const member = await this.prisma.communityMember.create({
      data: { communityId, userId, companyId, role: 'MEMBER', status },
    });

    if (status === 'ACTIVE') {
      await this.prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      });
    }

    return member;
  }

  async leaveCommunity(communityId: string, userId: string) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member');
    if (member.role === 'OWNER') throw new BadRequestException('Owner cannot leave; transfer ownership first');

    await this.prisma.communityMember.delete({ where: { id: member.id } });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    });
    return { message: 'Left community' };
  }

  async listMembers(communityId: string, query: { role?: CommunityMemberRole; status?: CommunityMemberStatus; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityMemberWhereInput = {
      communityId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : { status: 'ACTIVE' }),
    };

    const [data, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.communityMember.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async updateMemberRole(communityId: string, targetUserId: string, actorId: string, role: CommunityMemberRole) {
    const actor = await this.requireCommunityAccess(communityId, actorId, ['OWNER', 'ADMIN']);
    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === 'OWNER') throw new BadRequestException('Cannot change owner role');
    if (actor.role === 'ADMIN' && (role === 'OWNER' || role === 'ADMIN')) {
      throw new ForbiddenException('Admins cannot assign OWNER or ADMIN roles');
    }

    return this.prisma.communityMember.update({
      where: { id: target.id },
      data: { role },
    });
  }

  async removeMember(communityId: string, targetUserId: string, actorId: string) {
    await this.requireCommunityAccess(communityId, actorId, ['OWNER', 'ADMIN']);
    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new BadRequestException('Cannot remove owner');

    await this.prisma.communityMember.delete({ where: { id: target.id } });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    });
    return { message: 'Member removed' };
  }

  async myCommunities(userId: string) {
    return this.prisma.communityMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        community: {
          include: { category: true, _count: { select: { members: true, rooms: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async myInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) return [];
    return this.prisma.communityInvitation.findMany({
      where: { email: user.email, status: 'PENDING', expiresAt: { gte: new Date() } },
      include: {
        community: { select: { id: true, name: true, slug: true, description: true, memberCount: true, logo: true } },
        invitedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Invitations ───────────────────────────────────────────────────────

  async inviteMember(communityId: string, invitedById: string, data: { email: string; role?: CommunityMemberRole; message?: string }) {
    await this.requireCommunityAccess(communityId, invitedById, ['OWNER', 'ADMIN', 'MODERATOR']);

    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const alreadyMember = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: existingUser.id } },
      });
      if (alreadyMember && alreadyMember.status === 'ACTIVE') throw new ConflictException('User is already a member');
    }

    const token = uuid();
    return this.prisma.communityInvitation.create({
      data: {
        communityId,
        invitedById,
        email: data.email,
        token,
        role: data.role || 'MEMBER',
        message: data.message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async listInvitations(communityId: string, userId: string) {
    await this.requireCommunityAccess(communityId, userId, ['OWNER', 'ADMIN', 'MODERATOR']);
    return this.prisma.communityInvitation.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: { invitedBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async acceptInvitation(token: string, userId: string, companyId?: string) {
    const invitation = await this.prisma.communityInvitation.findUnique({ where: { token } });
    if (!invitation) throw new NotFoundException('Invalid invitation');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation already processed');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.communityInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invitation.email) throw new ForbiddenException('This invitation is for a different email');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: invitation.communityId, userId } },
    });
    if (existing && existing.status === 'ACTIVE') throw new ConflictException('Already a member');

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.communityMember.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', role: invitation.role, joinedAt: new Date(), companyId: companyId || existing.companyId },
        });
      } else {
        await tx.communityMember.create({
          data: {
            communityId: invitation.communityId,
            userId,
            companyId,
            role: invitation.role,
            status: 'ACTIVE',
            invitedById: invitation.invitedById,
          },
        });
      }

      await tx.communityInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.community.update({
        where: { id: invitation.communityId },
        data: { memberCount: { increment: 1 } },
      });
    });

    return { message: 'Invitation accepted' };
  }

  async rejectInvitation(token: string) {
    const invitation = await this.prisma.communityInvitation.findUnique({ where: { token } });
    if (!invitation) throw new NotFoundException('Invalid invitation');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation already processed');

    return this.prisma.communityInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REJECTED' },
    });
  }

  async cancelInvitation(invitationId: string, communityId: string, userId: string) {
    await this.requireCommunityAccess(communityId, userId, ['OWNER', 'ADMIN']);
    const invitation = await this.prisma.communityInvitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.communityId !== communityId) throw new NotFoundException('Invitation not found');
    return this.prisma.communityInvitation.update({
      where: { id: invitationId },
      data: { status: 'EXPIRED' },
    });
  }

  // ─── Discovery ─────────────────────────────────────────────────────────

  async discoverFeatured(limit = 12) {
    return this.prisma.community.findMany({
      where: { deletedAt: null, isActive: true, isFeatured: true },
      orderBy: { memberCount: 'desc' },
      take: limit,
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
  }

  async discoverTrending(limit = 12) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendingIds = await this.prisma.communityMember.groupBy({
      by: ['communityId'],
      where: { joinedAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    const ids = trendingIds.map((t) => t.communityId);
    if (ids.length === 0) {
      return this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { memberCount: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }
    const communities = await this.prisma.community.findMany({
      where: { id: { in: ids }, deletedAt: null, isActive: true },
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
    return ids.map((id) => communities.find((c) => c.id === id)).filter(Boolean);
  }

  async discoverRecommended(userId: string, limit = 12) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: { include: { industries: { include: { industry: true } } } } },
    });
    const industries = owner?.company?.industries?.map((ci) => ci.industry) || [];
    if (!industries.length) {
      return this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { memberCount: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }
    const industryIds = industries.map((i) => i.id);
    const industryNames = industries.map((i) => i.name.toLowerCase());
    const matched = await this.prisma.community.findMany({
      where: {
        deletedAt: null, isActive: true,
        OR: [
          { rooms: { some: { industryId: { in: industryIds } } } },
          { tags: { hasSome: industryNames } },
        ],
      },
      orderBy: { memberCount: 'desc' },
      take: limit,
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
    return matched;
  }

  async discoverNearby(userId: string, limit = 12) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: { include: { locations: { where: { latitude: { not: null }, longitude: { not: null } } } } } },
    });
    const locations = owner?.company?.locations || [];
    if (!locations.length) {
      return this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }
    const loc = locations[0];
    const nearbyCompanyIds = await this.prisma.companyLocation.findMany({
      where: {
        latitude: { not: null, gte: loc.latitude! - 1, lte: loc.latitude! + 1 },
        longitude: { not: null, gte: loc.longitude! - 1, lte: loc.longitude! + 1 },
        companyId: { not: owner!.company.id },
      },
      select: { companyId: true },
      distinct: ['companyId'],
      take: 50,
    });
    if (!nearbyCompanyIds.length) {
      return this.prisma.community.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }
    return this.prisma.community.findMany({
      where: {
        deletedAt: null, isActive: true,
        companyId: { in: nearbyCompanyIds.map((c) => c.companyId).filter(Boolean) as string[] },
      },
      orderBy: { memberCount: 'desc' },
      take: limit,
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
  }

  async discoverByIndustry(industryId: string, limit = 12) {
    return this.prisma.community.findMany({
      where: {
        deletedAt: null, isActive: true,
        rooms: { some: { industryId } },
      },
      orderBy: { memberCount: 'desc' },
      take: limit,
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
  }

  // ─── Rankings ─────────────────────────────────────────────────────────

  async getRankings(type: string, limit = 20) {
    const baseWhere = { deletedAt: null, isActive: true } as const;

    if (type === 'highest-trust') {
      const communities = await this.prisma.community.findMany({
        where: { ...baseWhere, companyId: { not: null } },
        include: {
          category: true,
          company: { select: { id: true, name: true, slug: true, trustScore: true } },
          _count: { select: { members: true, rooms: true } },
        },
        take: 100,
      });
      return communities
        .filter((c) => c.company?.trustScore != null)
        .sort((a, b) => (b.company!.trustScore as number) - (a.company!.trustScore as number))
        .slice(0, limit);
    }

    if (type === 'fastest-growing') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      return this.prisma.community.findMany({
        where: { ...baseWhere, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { memberCount: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }

    if (type === 'newest') {
      return this.prisma.community.findMany({
        where: baseWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { category: true, _count: { select: { members: true, rooms: true } } },
      });
    }

    // most-active and largest-membership
    return this.prisma.community.findMany({
      where: baseWhere,
      orderBy: { memberCount: 'desc' },
      take: limit,
      include: { category: true, _count: { select: { members: true, rooms: true } } },
    });
  }

  // ─── Member Discovery ─────────────────────────────────────────────────

  async getFeaturedMembers(limit = 20) {
    return this.prisma.communityMember.findMany({
      where: { role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, email: true, verificationLevel: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { joinedAt: 'desc' },
      take: limit,
    });
  }

  async getCommunityLeaders(limit = 20) {
    const leaders = await this.prisma.communityMember.groupBy({
      by: ['userId'],
      where: { role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
      _count: { communityId: true },
      orderBy: { _count: { communityId: 'desc' } },
      take: limit,
    });
    const userIds = leaders.map((l) => l.userId);
    const [users, companyOwners] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, verificationLevel: true },
      }),
      this.prisma.companyOwner.findMany({
        where: { userId: { in: userIds }, isPrimary: true },
        include: { company: { select: { id: true, name: true, slug: true, trustScore: true } } },
      }),
    ]);
    return leaders.map((l) => ({
      userId: l.userId,
      communityCount: l._count.communityId,
      user: users.find((u) => u.id === l.userId) || null,
      primaryCompany: companyOwners.find((co) => co.userId === l.userId)?.company || null,
    }));
  }

  // ─── Insights ─────────────────────────────────────────────────────────

  async getCommunityInsights() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalCommunities,
      totalMembers,
      communitiesCreated30d,
      membersJoined30d,
      industryDistribution,
      pendingInvitations,
      categoryDistribution,
    ] = await Promise.all([
      this.prisma.community.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.communityMember.count({ where: { status: 'ACTIVE' } }),
      this.prisma.community.count({ where: { deletedAt: null, isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.communityMember.count({ where: { status: 'ACTIVE', joinedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.industryRoom.groupBy({
        by: ['industryId'],
        where: { industryId: { not: null }, community: { deletedAt: null, isActive: true } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.communityInvitation.count({ where: { status: 'PENDING' } }),
      this.prisma.community.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, isActive: true, categoryId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const industryIds = industryDistribution.map((d) => d.industryId).filter(Boolean) as string[];
    const industries = industryIds.length
      ? await this.prisma.industry.findMany({ where: { id: { in: industryIds } }, select: { id: true, name: true } })
      : [];

    const categoryIds = categoryDistribution.map((d) => d.categoryId).filter(Boolean) as string[];
    const categories = categoryIds.length
      ? await this.prisma.communityCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
      : [];

    return {
      totalCommunities,
      totalMembers,
      communityGrowth30d: communitiesCreated30d,
      memberGrowth30d: membersJoined30d,
      pendingInvitations,
      industryDistribution: industryDistribution
        .filter((d) => d.industryId)
        .map((d) => ({ industryId: d.industryId!, count: d._count.id, industryName: industries.find((i) => i.id === d.industryId)?.name })),
      categoryDistribution: categoryDistribution
        .filter((d) => d.categoryId)
        .map((d) => ({ categoryId: d.categoryId!, count: d._count.id, categoryName: categories.find((c) => c.id === d.categoryId)?.name })),
    };
  }

  // ─── Dashboard Stats ──────────────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const [user, owner] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }),
      this.prisma.companyOwner.findFirst({
        where: { userId },
        include: { company: { include: { industries: { include: { industry: true } } } } },
      }),
    ]);
    const userEmail = user?.email;

    const [
      pendingInvitations,
      recommended,
      trendingIndustries,
      myCommunities,
    ] = await Promise.all([
      userEmail
        ? this.prisma.communityInvitation.count({
            where: { email: userEmail, status: 'PENDING', expiresAt: { gte: new Date() } },
          })
        : Promise.resolve(0),
      this.discoverRecommended(userId, 5),
      this.getTrendingIndustries(5),
      this.prisma.communityMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { id: true, communityId: true, community: { select: { id: true, name: true, slug: true, memberCount: true } } },
      }),
    ]);

    return {
      recommended,
      pendingInvitationsCount: pendingInvitations,
      trendingIndustries,
      myCommunityCount: myCommunities.length,
      totalMembersAcrossCommunities: myCommunities.reduce((sum, m) => sum + m.community.memberCount, 0),
      myCommunities: myCommunities.map((m) => m.community),
    };
  }

  private async getTrendingIndustries(limit = 5) {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.industryRoom.groupBy({
      by: ['industryId'],
      where: { industryId: { not: null }, community: { deletedAt: null, isActive: true }, createdAt: { gte: sixtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    const ids = result.map((r) => r.industryId).filter(Boolean) as string[];
    const industries = ids.length
      ? await this.prisma.industry.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true } })
      : [];
    return result
      .filter((r) => r.industryId)
      .map((r) => ({ industryId: r.industryId!, roomCount: r._count.id, industry: industries.find((i) => i.id === r.industryId) || null }));
  }

  // ─── Industry Rooms ────────────────────────────────────────────────────

  async createRoom(communityId: string, userId: string, data: {
    name: string; slug: string; description?: string; icon?: string; industryId?: string; sortOrder?: number;
  }) {
    await this.requireCommunityAccess(communityId, userId, ['OWNER', 'ADMIN', 'MODERATOR']);

    const existing = await this.prisma.industryRoom.findUnique({
      where: { communityId_slug: { communityId, slug: data.slug } },
    });
    if (existing) throw new ConflictException('Room slug already exists in this community');

    const room = await this.prisma.industryRoom.create({
      data: {
        communityId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        industryId: data.industryId,
        sortOrder: data.sortOrder || 0,
      },
    });

    await this.prisma.community.update({
      where: { id: communityId },
      data: { roomCount: { increment: 1 } },
    });

    return room;
  }

  async updateRoom(communityId: string, roomId: string, userId: string, data: {
    name?: string; slug?: string; description?: string; icon?: string; industryId?: string; sortOrder?: number; isActive?: boolean;
  }) {
    await this.requireCommunityAccess(communityId, userId, ['OWNER', 'ADMIN', 'MODERATOR']);
    const room = await this.prisma.industryRoom.findFirst({ where: { id: roomId, communityId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.prisma.industryRoom.update({ where: { id: roomId }, data });
  }

  async deleteRoom(communityId: string, roomId: string, userId: string) {
    await this.requireCommunityAccess(communityId, userId, ['OWNER', 'ADMIN']);
    const room = await this.prisma.industryRoom.findFirst({ where: { id: roomId, communityId } });
    if (!room) throw new NotFoundException('Room not found');
    await this.prisma.industryRoom.delete({ where: { id: roomId } });
    await this.prisma.community.update({
      where: { id: communityId },
      data: { roomCount: { decrement: 1 } },
    });
    return { message: 'Room deleted' };
  }

  async listRooms(communityId: string) {
    return this.prisma.industryRoom.findMany({
      where: { communityId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  async getCommunityActivity(communityId: string, userId?: string, limit = 20) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { visibility: true, deletedAt: true },
    });
    if (!community || community.deletedAt) throw new NotFoundException('Community not found');
    if (community.visibility === 'PRIVATE') {
      if (!userId) throw new ForbiddenException('Authentication required to view private community activity');
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const [recentPosts, recentMembers] = await Promise.all([
      this.prisma.socialPost.findMany({
        where: { communityId, deletedAt: null, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          type: true,
          publishedAt: true,
          likeCount: true,
          commentCount: true,
          author: { select: { id: true, name: true } },
        },
      }),
      this.prisma.communityMember.findMany({
        where: { communityId, status: 'ACTIVE' },
        orderBy: { joinedAt: 'desc' },
        take: limit,
        select: {
          joinedAt: true,
          role: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    const activity = [
      ...recentPosts.map((p) => ({
        type: 'post' as const,
        id: p.id,
        content: p.content.slice(0, 200),
        actor: p.author,
        timestamp: p.publishedAt.toISOString(),
        metadata: { type: p.type, likes: p.likeCount, comments: p.commentCount },
      })),
      ...recentMembers.map((m) => ({
        type: 'member_joined' as const,
        id: m.user.id,
        content: `${m.user.name} joined as ${m.role.toLowerCase()}`,
        actor: m.user,
        timestamp: m.joinedAt.toISOString(),
        metadata: { role: m.role },
      })),
    ];

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activity.slice(0, limit);
  }

  private async requireCommunityAccess(communityId: string, userId: string, allowedRoles: CommunityMemberRole[]) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') throw new ForbiddenException('Access denied');
    if (!allowedRoles.includes(member.role)) throw new ForbiddenException('Insufficient permissions');
    return member;
  }
}
