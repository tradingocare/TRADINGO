import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SocialPostType } from '@prisma/client';

@Injectable()
export class SocialFeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommunityFeed(communityId: string, userId: string, query: {
    type?: SocialPostType; roomId?: string; search?: string;
    page?: number; limit?: number;
  }) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { visibility: true, deletedAt: true },
    });
    if (!community || community.deletedAt) throw new NotFoundException('Community not found');
    if (community.visibility === 'PRIVATE') {
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      communityId,
      deletedAt: null,
      status: 'PUBLISHED',
    };

    if (query.type) where.type = query.type;
    if (query.roomId) where.roomId = query.roomId;
    if (query.search) {
      where.OR = [
        { content: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { likes: true, savedBy: true } },
        },
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    const enriched = await Promise.all(
      data.map(async (post) => {
        const [isLiked, isBookmarked] = await Promise.all([
          this.prisma.socialPostLike.findUnique({
            where: { postId_userId: { postId: post.id, userId } },
          }).then(Boolean),
          this.prisma.socialSavedPost.findUnique({
            where: { userId_postId: { userId, postId: post.id } },
          }).then(Boolean),
        ]);
        return {
          ...post,
          likeCount: post._count.likes,
          commentCount: post.commentCount,
          isLiked,
          isBookmarked,
          _count: undefined,
        };
      }),
    );

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getTrendingPosts(userId: string, limit = 10) {
    const publicPosts = await this.prisma.socialPost.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        community: { visibility: 'PUBLIC' },
      },
      orderBy: [{ likeCount: 'desc' }, { commentCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      include: {
        community: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    const isEnriched = userId && publicPosts.length < limit;
    if (!isEnriched) return publicPosts;

    const memberCommunities = await this.prisma.communityMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { communityId: true },
    });
    const memberIds = memberCommunities.map((m) => m.communityId);

    const memberPosts = await this.prisma.socialPost.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        communityId: { in: memberIds },
        NOT: { community: { visibility: 'PUBLIC' } },
      },
      orderBy: [{ likeCount: 'desc' }, { commentCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit - publicPosts.length,
      include: {
        community: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return [...publicPosts, ...memberPosts];
  }
}
