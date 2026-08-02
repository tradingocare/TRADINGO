import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { FollowType } from '@prisma/client';

@Injectable()
export class SocialFollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async follow(followerId: string, followingId: string, followingType: FollowType = FollowType.USER) {
    const existing = await this.prisma.socialFollow.findUnique({
      where: { followerId_followingId_followingType: { followerId, followingId, followingType } },
    });
    if (existing) return { following: true };

    await this.prisma.socialFollow.create({
      data: { followerId, followingId, followingType },
    });

    if (followerId !== followingId) {
      const [follower, primaryOwner] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: followerId }, select: { name: true } }),
        this.prisma.companyOwner.findFirst({
          where: { userId: followingId, isPrimary: true },
          select: { companyId: true },
        }),
      ]);
      if (primaryOwner?.companyId) {
        await this.notificationService.createWithTemplate(
          primaryOwner.companyId,
          followingId,
          'FOLLOW_RECEIVED' as any,
          { followerName: follower?.name || 'Someone' },
          { sourceModule: 'TRADETALK', link: '/tradetalk' },
        );
      }
    }

    return { following: true };
  }

  async unfollow(followerId: string, followingId: string, followingType: FollowType = FollowType.USER) {
    await this.prisma.socialFollow.deleteMany({
      where: { followerId, followingId, followingType },
    });
    return { following: false };
  }

  async isFollowing(followerId: string, followingId: string, followingType: FollowType = FollowType.USER) {
    const count = await this.prisma.socialFollow.count({
      where: { followerId, followingId, followingType },
    });
    return { following: count > 0 };
  }

  async getFollowers(followingId: string, followingType: FollowType = FollowType.USER, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followingId, followingType },
        include: { follower: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.socialFollow.count({ where: { followingId, followingType } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      items: items.map((f: { follower: { id: string; name: string; email: string }; createdAt: Date }) => ({
        id: f.follower.id,
        name: f.follower.name,
        email: f.follower.email,
        followedAt: f.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async getFollowing(followerId: string, followingType: FollowType = FollowType.USER, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followerId, followingType },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.socialFollow.count({ where: { followerId, followingType } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const userIds = items.filter((i: { followingType: string }) => i.followingType === FollowType.USER).map((i: { followingId: string }) => i.followingId);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u: { id: string; name: string; email: string }) => [u.id, u]));

    return {
      items: items.map((f: { followingId: string; followingType: string; createdAt: Date }) => {
        const u = userMap.get(f.followingId) as { id: string; name: string; email: string } | undefined;
        return {
          id: f.followingId,
          name: u?.name ?? f.followingId.slice(0, 8),
          email: u?.email ?? '',
          followedAt: f.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async getFollowCounts(followingId: string, followingType: FollowType = FollowType.USER) {
    const [followers, following] = await Promise.all([
      this.prisma.socialFollow.count({ where: { followingId, followingType } }),
      this.prisma.socialFollow.count({ where: { followerId: followingId, followingType } }),
    ]);
    return { followers, following };
  }
}
