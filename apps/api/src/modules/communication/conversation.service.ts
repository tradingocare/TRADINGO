import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    type: string;
    source: string;
    sourceId?: string;
    title?: string;
    createdBy: string;
    companyId: string;
    participants: { companyId: string; userId: string; role?: string }[];
  }) {
    const conversation = await this.prisma.conversation.create({
      data: {
        type: data.type as any,
        source: data.source as any,
        sourceId: data.sourceId,
        title: data.title,
        createdBy: data.createdBy,
        participants: {
          create: data.participants.map((p) => ({
            companyId: p.companyId,
            userId: p.userId,
            role: (p.role as any) ?? 'MEMBER',
          })),
        },
      },
      include: { participants: true },
    });

    await this.prisma.conversationAuditLog.create({
      data: { conversationId: conversation.id, action: 'CREATED', actorId: data.createdBy, metadata: { source: data.source, sourceId: data.sourceId } },
    });

    return conversation;
  }

  async findByUser(userId: string, filters?: { status?: string; source?: string; archived?: boolean }) {
    const where: any = { participants: { some: { userId } } };
    if (filters?.source) where.source = filters.source;
    if (filters?.archived !== undefined) where.participants = { some: { userId, isArchived: filters.archived } };

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        participants: { include: { company: { select: { id: true, name: true, slug: true, logo: true } }, user: { select: { id: true, name: true, email: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, content: true, type: true, createdAt: true, senderId: true } },
        labels: { include: { label: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => ({
      ...c,
      lastMessage: c.messages[0] ?? null,
      messages: undefined,
      unreadCount: 0,
    }));
  }

  async findById(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId } } },
      include: {
        participants: { include: { company: { select: { id: true, name: true, slug: true, logo: true } }, user: { select: { id: true, name: true, email: true } } } },
        labels: { include: { label: true } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async updateParticipant(userId: string, conversationId: string, data: { isArchived?: boolean; isMuted?: boolean; isPinned?: boolean; notes?: string }) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    return this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data,
    });
  }

  async archive(userId: string, conversationId: string) {
    return this.updateParticipant(userId, conversationId, { isArchived: true });
  }

  async mute(userId: string, conversationId: string, muted: boolean) {
    return this.updateParticipant(userId, conversationId, { isMuted: muted });
  }

  async pin(userId: string, conversationId: string, pinned: boolean) {
    return this.updateParticipant(userId, conversationId, { isPinned: pinned });
  }

  async addParticipant(conversationId: string, actorId: string, companyId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    const participant = await this.prisma.conversationParticipant.create({
      data: { conversationId, companyId, userId },
    });

    await this.prisma.conversationAuditLog.create({
      data: { conversationId, action: 'PARTICIPANT_ADDED', actorId, metadata: { userId, companyId } },
    });

    return participant;
  }

  async removeParticipant(conversationId: string, actorId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.prisma.conversationParticipant.delete({ where: { id: participant.id } });

    await this.prisma.conversationAuditLog.create({
      data: { conversationId, action: 'PARTICIPANT_REMOVED', actorId, metadata: { userId } },
    });
  }

  async getAuditLog(conversationId: string) {
    return this.prisma.conversationAuditLog.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
