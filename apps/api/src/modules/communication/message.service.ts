import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// P1-02 Part 3 — attachment limits mirror the TRADCONNECT sibling module
// (chat.service.ts MAX_ATTACHMENTS / MAX_FILE_SIZE_MB / ALLOWED_MIME_TYPES)
// so both messaging stacks enforce the same upload contract.
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

// No length cap exists anywhere in-repo (DB content is TEXT, no frontend
// maxlength); 5000 chars is a generous long-form chat message ceiling.
const MAX_CONTENT_LENGTH = 5000;

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  constructor(private readonly prisma: PrismaService) {}

  async send(conversationId: string, senderId: string, senderCompanyId: string, data: { type?: string; content?: string; replyToId?: string; attachments?: { type: string; url: string; originalName?: string; mimeType?: string; fileSize?: number }[] }) {
    // P1-02 Part 3 — conversation existence first (404), then participation
    // (403): mirrors the TRADCONNECT sibling (chat.service sendMessage) and
    // the existing getMessages participant gate in this file.
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

    const content = data.content?.trim() ? data.content : undefined;
    if (!content && (!data.attachments || data.attachments.length === 0)) {
      throw new BadRequestException('Message must have content or attachments');
    }
    if (content && content.length > MAX_CONTENT_LENGTH) {
      throw new BadRequestException(`Message must not exceed ${MAX_CONTENT_LENGTH} characters`);
    }
    if (data.attachments && data.attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
    }
    if (data.attachments) {
      for (const file of data.attachments) {
        if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
          throw new BadRequestException(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        }
        if (file.mimeType && !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
          throw new BadRequestException(`File type ${file.mimeType} is not allowed`);
        }
      }
    }
    if (data.replyToId) {
      // The reply snippet is returned inline by getMessages — a cross-thread
      // replyToId would leak another conversation's content. Scope it.
      const replyTarget = await this.prisma.message.findFirst({
        where: { id: data.replyToId, conversationId },
      });
      if (!replyTarget) throw new NotFoundException('Replied message not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderCompanyId,
        type: (data.type as any) ?? 'TEXT',
        content: content ?? null,
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

    // P1-02 Part 3 — sanitize pagination input: NaN/negative/zero values
    // (e.g. ?limit=abc) previously reached Prisma as NaN and threw a 500.
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 50;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.floor(offset) : 0;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        skip: safeOffset,
        include: { attachments: true, replyTo: { select: { id: true, content: true, senderId: true, createdAt: true } } },
      }),
      this.prisma.message.count({ where: { conversationId, isDeleted: false } }),
    ]);

    return { items: items.reverse(), total, limit: safeLimit, offset: safeOffset };
  }

  async markRead(conversationId: string, userId: string) {
    // P1-02 Part 3 — strangers must not flip other threads' read state:
    // participant lookup first (403 covers unknown IDs too — a malformed or
    // foreign conversationId can neither 500 nor mutate). Idempotent by
    // nature (same values rewritten). Mirrors updateParticipant's gate.
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');

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

    // P1-02 Part 3 — only participants may file reports (blocks report-queue
    // spam by ID guessing), and a reason is required (DTO @IsString alone
    // accepts "").
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: reportedById } },
    });
    if (!isParticipant) throw new ForbiddenException('Not a participant');
    if (!reason?.trim()) throw new BadRequestException('Report reason is required');

    return this.prisma.reportedMessage.create({
      data: { messageId, reportedById, reason, description },
    });
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      select: { id: true, participants: { where: { userId }, select: { lastReadAt: true } } },
      take: 500,
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
