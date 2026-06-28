import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  constructor(private readonly prisma: PrismaService) {}

  async send(conversationId: string, senderId: string, senderCompanyId: string, data: { type?: string; content?: string; replyToId?: string; attachments?: { type: string; url: string; originalName?: string; mimeType?: string; fileSize?: number }[] }) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderCompanyId,
        type: (data.type as any) ?? 'TEXT',
        content: data.content,
        replyToId: data.replyToId,
        attachments: data.attachments?.length ? { create: data.attachments } : undefined,
      },
      include: { attachments: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { attachments: true, replyTo: { select: { id: true, content: true, senderId: true, createdAt: true } } },
      }),
      this.prisma.message.count({ where: { conversationId, isDeleted: false } }),
    ]);

    return { items: items.reverse(), total, limit, offset };
  }

  async markRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, seenAt: null },
      data: { status: 'READ' as any, seenAt: new Date() },
    });
  }

  async deleteMessage(conversationId: string, messageId: string, userId: string) {
    const msg = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId, senderId: userId },
    });
    if (!msg) throw new NotFoundException('Message not found or not yours');

    await this.prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, content: '[deleted]' } });

    await this.prisma.conversationAuditLog.create({
      data: { conversationId, action: 'MESSAGE_DELETED', actorId: userId, metadata: { messageId } },
    });
  }

  async reportMessage(conversationId: string, messageId: string, reportedById: string, reason: string, description?: string) {
    const msg = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
    if (!msg) throw new NotFoundException('Message not found');

    return this.prisma.reportedMessage.create({
      data: { messageId, reportedById, reason, description },
    });
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      select: { id: true, participants: { where: { userId }, select: { lastReadAt: true } } },
    });

    let total = 0;
    for (const conv of conversations) {
      const lastReadAt = conv.participants[0]?.lastReadAt;
      const count = await this.prisma.message.count({
        where: { conversationId: conv.id, senderId: { not: userId }, createdAt: { gt: lastReadAt ?? new Date(0) }, isDeleted: false },
      });
      total += count;
    }
    return { total };
  }
}
