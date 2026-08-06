import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { SocialPostType } from '@prisma/client';

@Injectable()
export class SocialPostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createPost(userId: string, communityId: string, dto: {
    content: string; title?: string; type?: SocialPostType;
    mediaUrls?: string[]; linkUrl?: string; linkTitle?: string;
    linkDescription?: string; linkImage?: string; roomId?: string;
  }) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community || community.deletedAt) throw new NotFoundException('Community not found');

    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (membership?.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be an active member to post');
    }

    if (dto.roomId) {
      const room = await this.prisma.industryRoom.findFirst({
        where: { id: dto.roomId, communityId },
      });
      if (!room) throw new NotFoundException('Room not found in this community');
    }

    const post = await this.prisma.socialPost.create({
      data: {
        communityId,
        roomId: dto.roomId,
        authorId: userId,
        companyId: membership.companyId,
        type: dto.type || SocialPostType.TEXT,
        title: dto.title,
        content: dto.content,
        mediaUrls: dto.mediaUrls || [],
        linkUrl: dto.linkUrl,
        linkTitle: dto.linkTitle,
        linkDescription: dto.linkDescription,
        linkImage: dto.linkImage,
      },
    });

    await this.prisma.community.update({
      where: { id: communityId },
      data: { postCount: { increment: 1 } },
    });

    await this.ensureCommentConversation(post.id, userId, membership.companyId);

    return this.getPostById(post.id, userId);
  }

  async getPostById(postId: string, userId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const community = await this.prisma.community.findUnique({
      where: { id: post.communityId },
      select: { visibility: true },
    });
    if (community?.visibility === 'PRIVATE') {
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: post.communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const [likeCount, isLiked, isBookmarked, commentConversation] = await Promise.all([
      this.prisma.socialPostLike.count({ where: { postId } }),
      this.prisma.socialPostLike.findUnique({
        where: { postId_userId: { postId, userId } },
      }).then(Boolean),
      this.prisma.socialSavedPost.findUnique({
        where: { userId_postId: { userId, postId } },
      }).then(Boolean),
      this.prisma.conversation.findFirst({
        where: { source: 'POST', sourceId: postId, type: 'POST_COMMENT' },
      }),
    ]);

    let commentCount = post.commentCount;
    if (commentConversation) {
      commentCount = await this.prisma.message.count({
        where: { conversationId: commentConversation.id, isDeleted: false },
      });
    }

    const author = await this.prisma.user.findUnique({
      where: { id: post.authorId },
      select: { id: true, name: true, email: true },
    });

    return {
      ...post,
      author,
      isLiked,
      isBookmarked,
      likeCount: Math.max(likeCount, post.likeCount),
      commentCount,
    };
  }

  async updatePost(postId: string, userId: string, dto: Record<string, unknown>) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only edit your own posts');

    if (dto.roomId && typeof dto.roomId === 'string') {
      const room = await this.prisma.industryRoom.findFirst({
        where: { id: dto.roomId, communityId: post.communityId },
      });
      if (!room) throw new NotFoundException('Room not found in this community');
    }

    return this.prisma.socialPost.update({ where: { id: postId }, data: dto });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: post.communityId, userId } },
    });
    const isOwner = post.authorId === userId;
    const isMod = membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);

    if (!isOwner && !isMod) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.socialPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    await this.prisma.community.update({
      where: { id: post.communityId },
      data: { postCount: { decrement: 1 } },
    });

    return { message: 'Post deleted' };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
      include: { community: { select: { visibility: true } } },
    });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.community?.visibility === 'PRIVATE') {
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: post.communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const existing = await this.prisma.socialPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.socialPostLike.delete({ where: { id: existing.id } });
      const likeCount = await this.prisma.socialPostLike.count({ where: { postId } });
      await this.prisma.socialPost.update({ where: { id: postId }, data: { likeCount } });
      return { liked: false, likeCount };
    }

    await this.prisma.socialPostLike.create({ data: { postId, userId } });
    const likeCount = await this.prisma.socialPostLike.count({ where: { postId } });
    await this.prisma.socialPost.update({ where: { id: postId }, data: { likeCount } });

    if (post.authorId !== userId) {
      const [liker, authorMembership] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
        this.prisma.communityMember.findFirst({
          where: { communityId: post.communityId, userId: post.authorId },
          select: { companyId: true },
        }),
      ]);
      if (authorMembership?.companyId) {
        await this.notificationService.createWithTemplate(
          authorMembership.companyId,
          post.authorId,
          'POST_LIKED' as any,
          { userName: liker?.name || 'Someone' },
          { sourceModule: 'TRADETALK', link: `/tradetalk/posts/${postId}` },
        );
      }
    }

    return { liked: true, likeCount };
  }

  async getLikes(postId: string, page = 1, limit = 20) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.socialPostLike.findMany({
        where: { postId },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialPostLike.count({ where: { postId } }),
    ]);

    return {
      data: data.map((l) => l.user),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async toggleBookmark(postId: string, userId: string) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
      include: { community: { select: { visibility: true } } },
    });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.community?.visibility === 'PRIVATE') {
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: post.communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const existing = await this.prisma.socialSavedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.socialSavedPost.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await this.prisma.socialSavedPost.create({ data: { userId, postId } });
    return { bookmarked: true };
  }

  async sharePost(postId: string, userId?: string) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
      include: { community: { select: { visibility: true } } },
    });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    if (post.community?.visibility === 'PRIVATE' && userId) {
      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: post.communityId, userId } },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this private community');
    }

    const shareCount = post.shareCount + 1;
    await this.prisma.socialPost.update({ where: { id: postId }, data: { shareCount } });
    return { shareCount };
  }

  // ═══ Comments — Reuse Message model from Chat ═════════════════════════

  private async ensureCommentConversation(postId: string, userId: string, companyId: string | null) {
    const existing = await this.prisma.conversation.findFirst({
      where: { source: 'POST', sourceId: postId, type: 'POST_COMMENT' },
    });
    if (existing) return existing;

    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    const title = post?.title || post?.content?.slice(0, 80) || 'Post comments';

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'POST_COMMENT',
        source: 'POST',
        sourceId: postId,
        title: `Comments: ${title}`,
        createdBy: userId,
        participants: {
          create: {
            userId,
            companyId: companyId || '',
            role: 'MEMBER',
          },
        },
      },
    });

    return conversation;
  }

  async sendComment(postId: string, userId: string, companyId: string | null, content: string, replyToId?: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: post.communityId, userId } },
    });
    if (membership?.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be a member to comment');
    }

    const conversation = await this.ensureCommentConversation(postId, userId, companyId);

    const existingParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
    });
    if (!existingParticipant) {
      await this.prisma.conversationParticipant.create({
        data: { conversationId: conversation.id, userId, companyId: companyId || '', role: 'MEMBER' },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderCompanyId: companyId || '',
        type: 'TEXT',
        content,
        replyToId: replyToId || null,
      },
      include: { attachments: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    const commentCount = await this.prisma.message.count({
      where: { conversationId: conversation.id, isDeleted: false },
    });
    await this.prisma.socialPost.update({ where: { id: postId }, data: { commentCount } });

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (post.authorId !== userId) {
      const authorMembership = await this.prisma.communityMember.findFirst({
        where: { communityId: post.communityId, userId: post.authorId },
        select: { companyId: true },
      });
      if (authorMembership?.companyId) {
        await this.notificationService.createWithTemplate(
          authorMembership.companyId,
          post.authorId,
          'COMMENT_ADDED' as any,
          { authorName: sender?.name || 'Someone' },
          { sourceModule: 'TRADETALK', link: `/tradetalk/posts/${postId}` },
        );
      }
    }

    return { ...message, sender };
  }

  async getComments(postId: string, userId: string, page = 1, limit = 50) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const conversation = await this.prisma.conversation.findFirst({
      where: { source: 'POST', sourceId: postId, type: 'POST_COMMENT' },
    });
    if (!conversation) {
      return { items: [], total: 0, page, limit, totalPages: 0, hasNext: false, hasPrevious: false };
    }

    const existingParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
    });
    if (!existingParticipant) {
      await this.prisma.conversationParticipant.create({
        data: { conversationId: conversation.id, userId, companyId: '', role: 'MEMBER' },
      });
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: conversation.id, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          attachments: true,
          replyTo: { select: { id: true, content: true, senderId: true, createdAt: true } },
        },
      }),
      this.prisma.message.count({ where: { conversationId: conversation.id, isDeleted: false } }),
    ]);

    const senderIds = [...new Set(items.map((m) => m.senderId))];
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, email: true },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const enriched = items.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      replyToId: msg.replyToId,
      replyTo: msg.replyTo,
      createdAt: msg.createdAt,
      sender: senderMap.get(msg.senderId) || null,
      isOwn: msg.senderId === userId,
    }));

    return {
      items: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrevious: page > 1,
    };
  }

  async deleteComment(postId: string, messageId: string, userId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');

    const conversation = await this.prisma.conversation.findFirst({
      where: { source: 'POST', sourceId: postId, type: 'POST_COMMENT' },
    });
    if (!conversation) throw new NotFoundException('Comment not found');

    const msg = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId: conversation.id, senderId: userId },
    });
    if (!msg) throw new NotFoundException('Comment not found or not yours');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '[deleted]' },
    });

    const commentCount = await this.prisma.message.count({
      where: { conversationId: conversation.id, isDeleted: false },
    });
    await this.prisma.socialPost.update({ where: { id: postId }, data: { commentCount } });

    return { message: 'Comment deleted' };
  }

  async setPinPost(postId: string, isPinned: boolean) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    return this.prisma.socialPost.update({ where: { id: postId }, data: { isPinned } });
  }
}
