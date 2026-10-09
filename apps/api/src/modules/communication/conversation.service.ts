import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    // P1-02 Part 2 (HIGH-1): the authenticated caller must be the effective
    // actor — a caller cannot create a conversation on behalf of other
    // identities. The caller (createdBy, JWT-derived) must be listed among
    // the participants; target participant IDs remain caller-supplied resource
    // references, validated for membership only here (existence/ownership
    // validation is Part-3 validation scope).
    if (!data.participants.some((p) => p.userId === data.createdBy)) {
      throw new ForbiddenException('Conversation creator must be a participant');
    }
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
      take: 100,
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
    // P1-02 Part 2 (HIGH-2): the actor must be a participant of the
    // conversation — client-supplied actor identity never grants authority by
    // itself, and arbitrary users cannot inject third parties into threads.
    const actor = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: actorId } },
    });
    if (!actor) throw new ForbiddenException('Not a participant');

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
    // P1-02 Part 2 (HIGH-2): same bar as adding — only a participant may
    // remove participants (including leaving oneself).
    const actor = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: actorId } },
    });
    if (!actor) throw new ForbiddenException('Not a participant');

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.prisma.conversationParticipant.delete({ where: { id: participant.id } });

    await this.prisma.conversationAuditLog.create({
      data: { conversationId, action: 'PARTICIPANT_REMOVED', actorId, metadata: { userId } },
    });
  }

  // P1-02 Part 2 (HIGH-3): the audit trail is participant-gated on READ —
  // any authenticated user could previously dump any conversation's trail by
  // ID guessing. All audit ACTOR values were already JWT-derived on write
  // (create/openOrCreate/add/remove/deleteMessage), verified unchanged.
  async getAuditLog(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId } } },
      select: { id: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.prisma.conversationAuditLog.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * P1-02 Part 1 — open-or-create a 1:1 contact conversation.
   * The frontend cannot legitimately know participant userIds (public company
   * payloads strip owner ids by design), so both sides are resolved here:
   * caller via their CompanyOwner linkage (primary first, same as JWT
   * enrichment), target via the company's primary owner (fallback: any owner).
   * Returns the existing thread for the same (caller, target, context) when
   * one already exists — repeated Chat clicks do not spawn duplicates.
   * No schema change; reuses existing columns, relations and audit logging.
   */
  async openOrCreate(
    userId: string,
    input: { companyId: string; productId?: string; title?: string },
  ) {
    const callerOwner =
      (await this.prisma.companyOwner.findFirst({
        where: { userId, isPrimary: true },
        select: { companyId: true },
      })) ??
      (await this.prisma.companyOwner.findFirst({
        where: { userId },
        select: { companyId: true },
      }));
    if (!callerOwner) {
      throw new BadRequestException('Complete your company profile to start a conversation');
    }

    const targetCompany =
      (await this.prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true, name: true },
      })) ??
      (await this.prisma.company.findFirst({
        where: { slug: input.companyId, deletedAt: null },
        select: { id: true, name: true },
      }));
    if (!targetCompany) throw new NotFoundException('Company not found');

    const targetOwner =
      (await this.prisma.companyOwner.findFirst({
        where: { companyId: targetCompany.id, isPrimary: true },
        select: { userId: true },
      })) ??
      (await this.prisma.companyOwner.findFirst({
        where: { companyId: targetCompany.id },
        select: { userId: true },
      }));
    if (!targetOwner) throw new NotFoundException('Company has no contactable owner');

    if (targetOwner.userId === userId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    const source = input.productId ? 'PRODUCT' : 'COMPANY';
    const sourceId = input.productId ?? targetCompany.id;

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetOwner.userId } } },
          { source: source as any, sourceId },
        ],
      },
      include: { participants: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'DIRECT' as any,
        source: source as any,
        sourceId,
        title: input.title ?? targetCompany.name,
        createdBy: userId,
        participants: {
          create: [
            { companyId: callerOwner.companyId, userId, role: 'MEMBER' as any },
            { companyId: targetCompany.id, userId: targetOwner.userId, role: 'MEMBER' as any },
          ],
        },
      },
      include: { participants: true },
    });

    await this.prisma.conversationAuditLog.create({
      data: {
        conversationId: conversation.id,
        action: 'CREATED',
        actorId: userId,
        metadata: { source, sourceId, via: 'open' },
      },
    });

    return conversation;
  }
}
