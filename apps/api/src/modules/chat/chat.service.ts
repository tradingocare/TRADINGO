import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { ChatFilterService } from './chat-filter.service';
import { CreateConversationDto, SendMessageDto, SearchMessagesDto, ReportMessageDto } from './dto/chat.dto';
import { StorageService } from '../storage/storage.service';

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip',
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatFilter: ChatFilterService,
    private readonly storageService: StorageService,
    private readonly notifService: NotificationService,
  ) {}

  async createConversation(companyId: string, userId: string, dto: CreateConversationDto) {
    const participantIds = dto.participantCompanyIds;

    if (!participantIds.includes(companyId)) {
      participantIds.unshift(companyId);
    }

    if (dto.type === 'DIRECT' && participantIds.length !== 2) {
      throw new BadRequestException('Direct conversations require exactly 2 participants');
    }

    if (dto.type === 'RFQ_NEGOTIATION') {
      if (!dto.rfqId) throw new BadRequestException('RFQ ID is required for negotiation chat');
      const rfq = await this.prisma.rfq.findFirst({ where: { id: dto.rfqId, deletedAt: null } });
      if (!rfq) throw new NotFoundException('RFQ not found');
      if (!participantIds.some((id) => id === rfq.companyId)) {
        throw new ForbiddenException('Only the RFQ owner can create a negotiation chat');
      }
    }

    const existing = await this.findExistingDirectConversation(participantIds);
    if (existing && dto.type === 'DIRECT') return existing;

    const users = await this.prisma.companyOwner.findMany({
      where: { companyId: { in: participantIds }, isPrimary: true },
      select: { userId: true, companyId: true },
    });

    if (!users.some((u) => u.userId === userId)) {
      throw new ForbiddenException('You must be an owner of one of the participant companies');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type,
        title: dto.title,
        rfqId: dto.rfqId ?? null,
        createdBy: userId,
        participants: {
          create: users.map((u) => ({
            companyId: u.companyId,
            userId: u.userId,
            role: 'MEMBER' as any,
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    return conversation;
  }

  async getConversations(companyId: string, userId: string, page = 1, limit = 20) {
    const where: any = {
      participants: { some: { userId, leftAt: null } },
    };

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          participants: {
            include: { company: { select: { id: true, name: true, slug: true, logo: true } } },
          },
          messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { attachments: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const conversationsWithUnread = await Promise.all(
      data.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const unreadCount = participant?.lastReadAt
          ? await this.prisma.message.count({
              where: { conversationId: conv.id, createdAt: { gt: participant.lastReadAt }, senderId: { not: userId } },
            })
          : await this.prisma.message.count({
              where: { conversationId: conv.id, senderId: { not: userId } },
            });
        return { ...conv, unreadCount };
      }),
    );

    return { data: conversationsWithUnread, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getConversationById(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true } } },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException('Access denied');
    }
    return conv;
  }

  async archiveConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { where: { userId } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participants.length === 0) throw new ForbiddenException('Access denied');

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { leftAt: new Date() },
    });

    return { message: 'Conversation archived' };
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { where: { userId } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participants.length === 0) throw new ForbiddenException('Access denied');

    const where: any = { conversationId };
    if (cursor) {
      const cursorMessage = await this.prisma.message.findUnique({ where: { id: cursor } });
      if (cursorMessage) where.createdAt = { lt: cursorMessage.createdAt };
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        attachments: true,
        replyTo: { select: { id: true, content: true, senderId: true, createdAt: true, type: true } },
      },
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return { data: messages, nextCursor: hasMore ? messages[messages.length - 1]?.id : null };
  }

  async sendMessage(conversationId: string, companyId: string, userId: string, dto: SendMessageDto) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { where: { userId, leftAt: null } }, blockedUsers: { where: { blockedUserId: userId } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participants.length === 0) throw new ForbiddenException('Access denied');
    if (conv.blockedUsers.length > 0) throw new ForbiddenException('You are blocked in this conversation');

    if (!dto.content && (!dto.attachments || dto.attachments.length === 0)) {
      throw new BadRequestException('Message must have content or attachments');
    }

    if (dto.attachments && dto.attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
    }

    if (dto.attachments) {
      for (const file of dto.attachments) {
        if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
          throw new BadRequestException(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        }
        if (file.mimeType && !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
          throw new BadRequestException(`File type ${file.mimeType} is not allowed`);
        }
      }
    }

    const filterResult = dto.content ? this.chatFilter.detectSensitiveContent(dto.content) : { hasProfanity: false, hasPhone: false, hasEmail: false };
    let content = dto.content ?? null;
    if (content && filterResult.hasProfanity) {
      content = this.chatFilter.sanitizeMessage(content);
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderCompanyId: companyId,
        type: dto.attachments?.some((a) => a.type === 'IMAGE') ? 'IMAGE'
          : dto.attachments?.some((a) => a.type === 'VOICE') ? 'VOICE'
          : dto.attachments?.length ? 'FILE' : 'TEXT',
        content,
        replyToId: dto.replyToId ?? null,
        deliveredAt: new Date(),
        attachments: dto.attachments?.length
          ? { create: dto.attachments.map((a) => ({ type: a.type, url: a.url, originalName: a.originalName, mimeType: a.mimeType, fileSize: a.fileSize, width: a.width, height: a.height, duration: a.duration })) }
          : undefined,
      },
      include: { attachments: true, replyTo: { select: { id: true, content: true, senderId: true, createdAt: true, type: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const otherParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId }, leftAt: null },
      select: { userId: true, companyId: true },
    });

    const senderUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const senderName = senderUser?.name ?? 'Unknown';

    for (const p of otherParticipants) {
      try {
        await this.notifService.createWithTemplate(
          p.companyId,
          p.userId,
          NotificationType.NEW_MESSAGE,
          { senderName },
        );
      } catch (err) {
        this.logger.warn(`Failed to send NEW_MESSAGE notification to user ${p.userId}: ${(err as Error).message}`);
      }
    }

    if (content) {
      try {
        const mentionRegex = /@(\S+)/g;
        const mentionedNames: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = mentionRegex.exec(content)) !== null) {
          const name = m[1].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (name) mentionedNames.push(name);
        }
        if (mentionedNames.length > 0) {
          const allParticipants = await this.prisma.conversationParticipant.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true, companyId: true },
          });
          const allUserIds = [...new Set(allParticipants.map((p) => p.userId))];
          const allUsers = await this.prisma.user.findMany({
            where: { id: { in: allUserIds } },
            select: { id: true, name: true },
          });
          const conversationName = conv.title ?? 'Conversation';
          for (const mentioned of mentionedNames) {
            const matched = allUsers.find((u) => u.name.toLowerCase().includes(mentioned));
            if (matched && matched.id !== userId) {
              const participant = allParticipants.find((p) => p.userId === matched.id);
              if (participant) {
                try {
                  await this.notifService.createWithTemplate(
                    participant.companyId,
                    participant.userId,
                    NotificationType.USER_MENTION,
                    { senderName, conversationName },
                  );
                } catch (err) {
                  this.logger.warn(`Failed to send USER_MENTION notification to user ${participant.userId}: ${(err as Error).message}`);
                }
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to process USER_MENTION notifications: ${(err as Error).message}`);
      }
    }

    return { message, recipientUserIds: otherParticipants.map((p) => p.userId), filterResult };
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!msg || msg.conversationId !== conversationId) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Can only delete own messages');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: null },
    });

    return { message: 'Message deleted' };
  }

  async markAsSeen(conversationId: string, messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) throw new NotFoundException('Message not found');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { seenAt: new Date() },
    });

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { message: 'Marked as seen' };
  }

  async searchMessages(companyId: string, userId: string, dto: SearchMessagesDto) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId, leftAt: null } } },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return { data: [], meta: { total: 0, page: dto.page ?? 1, limit: dto.limit ?? 20, totalPages: 0 } };

    const where: any = {
      conversationId: { in: conversationIds },
      isDeleted: false,
      content: { contains: dto.q, mode: 'insensitive' },
    };
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { attachments: true, conversation: { select: { id: true, title: true, type: true } } },
      }),
      this.prisma.message.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async blockUser(conversationId: string, blockedUserId: string, userId: string, reason?: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { where: { userId } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participants.length === 0) throw new ForbiddenException('Access denied');

    const targetParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: blockedUserId } },
    });
    if (!targetParticipant) throw new BadRequestException('User is not a participant');

    const existing = await this.prisma.blockedUser.findUnique({
      where: { conversationId_blockedUserId: { conversationId, blockedUserId } },
    });
    if (existing) throw new BadRequestException('User is already blocked');

    await this.prisma.blockedUser.create({
      data: { conversationId, blockedById: userId, blockedUserId, reason },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_BLOCKED',
        resource: `conversation:${conversationId}`,
        metadata: { blockedUserId, reason },
      },
    });

    return { message: 'User blocked' };
  }

  async reportMessage(conversationId: string, messageId: string, userId: string, dto: ReportMessageDto) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) throw new NotFoundException('Message not found');

    await this.prisma.reportedMessage.create({
      data: { messageId, reportedById: userId, reason: dto.reason, description: dto.description },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MESSAGE_REPORTED',
        resource: `message:${messageId}`,
        metadata: { conversationId, reason: dto.reason },
      },
    });

    return { message: 'Message reported' };
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId, leftAt: null } } },
      select: { id: true },
    });

    let totalUnread = 0;
    for (const conv of conversations) {
      const participant = await this.prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: conv.id, userId } },
      });
      const count = participant?.lastReadAt
        ? await this.prisma.message.count({
            where: { conversationId: conv.id, createdAt: { gt: participant.lastReadAt }, senderId: { not: userId } },
          })
        : await this.prisma.message.count({
            where: { conversationId: conv.id, senderId: { not: userId } },
          });
      totalUnread += count;
    }

    return { totalUnread };
  }

  async getOrCreateRfqConversation(companyId: string, rfqId: string, userId: string) {
    await this.validateRfqAccess(rfqId, companyId);

    const existing = await this.prisma.conversation.findFirst({
      where: { rfqId, type: 'RFQ_NEGOTIATION' },
      include: { participants: true },
    });

    if (existing) {
      const isParticipant = existing.participants.some((p) => p.userId === userId);
      if (!isParticipant) throw new ForbiddenException('Access denied');
      return existing;
    }

    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const matches = await this.prisma.rfqVendorMatch.findMany({
      where: { rfqId, status: { in: ['SENT', 'VIEWED', 'QUOTED'] } },
      select: { companyId: true },
    });

    const participantCompanyIds = [rfq.companyId, ...matches.map((m) => m.companyId)];
    const users = await this.prisma.companyOwner.findMany({
      where: { companyId: { in: participantCompanyIds }, isPrimary: true },
      select: { userId: true, companyId: true },
    });

    const conv = await this.prisma.conversation.create({
      data: {
        type: 'RFQ_NEGOTIATION',
        title: `RFQ: ${rfq.title ?? rfq.rfqNumber ?? rfqId}`,
        rfqId,
        createdBy: userId,
        participants: { create: users.map((u) => ({ companyId: u.companyId, userId: u.userId, role: 'MEMBER' as any })) },
      },
      include: { participants: true },
    });

    return conv;
  }

  async generateUploadUrl(companyId: string, userId: string, fileName: string, mimeType: string, fileSize: number) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }

    const key = `chat/${companyId}/${userId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const presignedUrl = await this.storageService.generatePresignedUrl(key, 3600);
    return { key, presignedUrl, cdnUrl: presignedUrl };
  }

  private async validateRfqAccess(rfqId: string, companyId: string): Promise<void> {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    if (rfq.companyId === companyId) return;

    const match = await this.prisma.rfqVendorMatch.findFirst({
      where: { rfqId, companyId, status: { in: ['SENT', 'VIEWED', 'QUOTED'] } },
    });
    if (!match) throw new ForbiddenException('Only matched vendors can access this RFQ chat');
  }

  private async findExistingDirectConversation(companyIds: string[]) {
    const users = await this.prisma.companyOwner.findMany({
      where: { companyId: { in: companyIds }, isPrimary: true },
      select: { userId: true },
    });
    const userIds = users.map((u) => u.userId);
    if (userIds.length < 2) return null;

    const conversations = await this.prisma.conversation.findMany({
      where: { type: 'DIRECT' },
      include: { participants: { select: { userId: true } } },
    });

    return conversations.find((conv) =>
      conv.participants.length === userIds.length &&
      userIds.every((uid) => conv.participants.some((p) => p.userId === uid)),
    ) ?? null;
  }
}
