import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BetaInviteStatus,
  BetaOnboardingStep,
  FeedbackStatus,
  FeedbackType,
  TicketStatus,
  Prisma,
} from '@prisma/client';
import * as crypto from 'crypto';

const ONBOARDING_STEPS: BetaOnboardingStep[] = [
  'INVITE_ACCEPTED',
  'PROFILE_SETUP',
  'COMPANY_VERIFICATION',
  'PRODUCT_SETUP',
  'RFQ_CONFIGURATION',
  'TEAM_INVITES',
  'INTEGRATION_SETUP',
  'GO_LIVE',
  'ONBOARDING_COMPLETE',
];

@Injectable()
export class BetaProgramService {
  private readonly logger = new Logger(BetaProgramService.name);

  constructor(private readonly prisma: PrismaService) {}

  private jsonValue(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
    return value as Prisma.InputJsonValue | undefined;
  }

  // ──────────────── INVITES ────────────────

  async createInvite(dto: { email: string; companyName?: string; message?: string }, userId: string) {
    const existing = await this.prisma.betaInvite.findFirst({
      where: { email: dto.email, status: { in: ['PENDING', 'ACCEPTED'] as BetaInviteStatus[] } },
    });
    if (existing) {
      throw new ConflictException('An active invite already exists for this email');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.prisma.betaInvite.create({
      data: {
        email: dto.email,
        companyName: dto.companyName,
        message: dto.message,
        token,
        expiresAt,
        invitedById: userId,
      },
    });

    this.logger.log(`Beta invite created for ${dto.email}`);
    return invite;
  }

  async getInvites(companyId?: string, status?: string) {
    const where: Prisma.BetaInviteWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status as BetaInviteStatus;

    return this.prisma.betaInvite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(token: string, companyId: string) {
    const invite = await this.prisma.betaInvite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== 'PENDING') throw new ConflictException('Invite is no longer pending');
    if (invite.expiresAt < new Date()) throw new ConflictException('Invite has expired');

    const updated = await this.prisma.betaInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED' as BetaInviteStatus,
        companyId,
        acceptedAt: new Date(),
      },
    });

    await this.prisma.betaCompanyProfile.create({
      data: {
        companyId,
        onboardingStep: 'INVITE_ACCEPTED',
      },
    });

    this.logger.log(`Beta invite ${token} accepted for company ${companyId}`);
    return updated;
  }

  async revokeInvite(inviteId: string) {
    const invite = await this.prisma.betaInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status === 'ACCEPTED') throw new ConflictException('Cannot revoke an accepted invite');

    const updated = await this.prisma.betaInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' as BetaInviteStatus },
    });

    this.logger.log(`Beta invite ${inviteId} revoked`);
    return updated;
  }

  async getInviteStats() {
    const [pending, accepted, expired, revoked] = await Promise.all([
      this.prisma.betaInvite.count({ where: { status: 'PENDING' } }),
      this.prisma.betaInvite.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.betaInvite.count({ where: { status: 'EXPIRED' } }),
      this.prisma.betaInvite.count({ where: { status: 'REVOKED' } }),
    ]);

    return { pending, accepted, expired, revoked, total: pending + accepted + expired + revoked };
  }

  // ──────────────── FEEDBACK ────────────────

  async submitFeedback(
    dto: {
      type: string;
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      score?: number;
      comment?: string;
      businessImpact?: string;
      page?: string;
    },
    userId?: string,
    companyId?: string,
  ) {
    return this.prisma.feedback.create({
      data: {
        type: dto.type as FeedbackType,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        score: dto.score,
        comment: dto.comment,
        businessImpact: dto.businessImpact,
        page: dto.page,
        userId,
        companyId,
      },
    });
  }

  async getFeedback(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.FeedbackWhereInput = {};
    if (filters?.status) where.status = filters.status as FeedbackStatus;
    if (filters?.type) where.type = filters.type as FeedbackType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    return this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
  }

  async getFeedbackStats() {
    const [total, bugs, features, nps, general] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { type: 'BUG' } }),
      this.prisma.feedback.count({ where: { type: 'FEATURE' } }),
      this.prisma.feedback.count({ where: { type: 'NPS' } }),
      this.prisma.feedback.count({ where: { type: 'GENERAL' } }),
    ]);

    const npsResult = await this.prisma.feedback.aggregate({
      where: { type: 'NPS', score: { not: null } },
      _avg: { score: true },
    });

    return {
      total,
      byType: { BUG: bugs, FEATURE: features, NPS: nps, GENERAL: general },
      npsAverage: npsResult._avg.score ?? null,
    };
  }

  // ──────────────── USAGE TRACKING ────────────────

  async trackEvent(dto: {
    eventName: string;
    category?: string;
    properties?: Record<string, unknown>;
    sessionId?: string;
    companyId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        eventName: dto.eventName,
        category: dto.category,
        properties: this.jsonValue(dto.properties),
        sessionId: dto.sessionId,
        companyId: dto.companyId,
        userId: dto.userId,
        ip: dto.ip,
        userAgent: dto.userAgent,
      },
    });
  }

  async getUsageStats(companyId: string, period?: string) {
    const where: Prisma.UsageEventWhereInput = { companyId };
    if (period === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.timestamp = { gte: thirtyDaysAgo };
    }

    const events = await this.prisma.usageEvent.findMany({ where, select: { eventName: true, category: true } });

    const byCategory: Record<string, number> = {};
    const byEvent: Record<string, number> = {};
    for (const e of events) {
      if (e.category) byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      byEvent[e.eventName] = (byEvent[e.eventName] || 0) + 1;
    }

    return { total: events.length, byCategory, byEvent };
  }

  async getTopEvents(companyId: string, limit = 10) {
    const events = await this.prisma.usageEvent.groupBy({
      by: ['eventName'],
      where: { companyId },
      _count: { eventName: true },
      orderBy: { _count: { eventName: 'desc' } },
      take: limit,
    });

    return events.map((e) => ({ eventName: e.eventName, count: e._count.eventName }));
  }

  // ──────────────── ERROR TRACKING ────────────────

  async reportError(dto: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    page?: string;
    action?: string;
    metadata?: Record<string, unknown>;
    companyId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.errorEvent.create({
      data: {
        errorType: dto.errorType,
        errorMessage: dto.errorMessage,
        stackTrace: dto.stackTrace,
        page: dto.page,
        action: dto.action,
        metadata: this.jsonValue(dto.metadata),
        companyId: dto.companyId ?? undefined,
        userId: dto.userId,
        ip: dto.ip,
        userAgent: dto.userAgent,
      },
    });
  }

  async getErrors(filters?: {
    page?: number;
    limit?: number;
    resolved?: boolean;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.ErrorEventWhereInput = {};
    if (filters?.resolved !== undefined) where.resolved = filters.resolved;
    if (filters?.type) where.errorType = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.errorEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.errorEvent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveError(id: string) {
    const error = await this.prisma.errorEvent.findUnique({ where: { id } });
    if (!error) throw new NotFoundException('Error event not found');

    return this.prisma.errorEvent.update({
      where: { id },
      data: { resolved: true },
    });
  }

  async getErrorStats() {
    const [total, resolved, unresolved] = await Promise.all([
      this.prisma.errorEvent.count(),
      this.prisma.errorEvent.count({ where: { resolved: true } }),
      this.prisma.errorEvent.count({ where: { resolved: false } }),
    ]);

    const byTypeRaw = await this.prisma.errorEvent.groupBy({
      by: ['errorType'],
      _count: { errorType: true },
    });
    const byType: Record<string, number> = {};
    for (const r of byTypeRaw) {
      byType[r.errorType] = r._count.errorType;
    }

    return { total, resolved, unresolved, byType };
  }

  // ──────────────── ONBOARDING ────────────────

  async getOnboardingStatus(companyId: string) {
    const profile = await this.prisma.betaCompanyProfile.findUnique({
      where: { companyId },
    });
    if (!profile) throw new NotFoundException('Beta company profile not found');
    return profile;
  }

  async advanceOnboardingStep(companyId: string) {
    const profile = await this.prisma.betaCompanyProfile.findUnique({
      where: { companyId },
    });
    if (!profile) throw new NotFoundException('Beta company profile not found');

    const currentIndex = ONBOARDING_STEPS.indexOf(profile.onboardingStep);
    if (currentIndex === -1) throw new BadRequestException('Unknown onboarding step');
    if (currentIndex >= ONBOARDING_STEPS.length - 1) {
      throw new BadRequestException('Onboarding already complete');
    }

    const nextStep = ONBOARDING_STEPS[currentIndex + 1];
    const isComplete = nextStep === 'ONBOARDING_COMPLETE';

    const updated = await this.prisma.betaCompanyProfile.update({
      where: { companyId },
      data: {
        onboardingStep: nextStep,
        onboardingCompletedAt: isComplete ? new Date() : undefined,
        setupProgress: Math.round(((currentIndex + 2) / ONBOARDING_STEPS.length) * 100),
      },
    });

    this.logger.log(`Company ${companyId} advanced to onboarding step ${nextStep}`);
    return updated;
  }

  async getOnboardingProgress(companyId: string) {
    const profile = await this.prisma.betaCompanyProfile.findUnique({
      where: { companyId },
    });
    if (!profile) throw new NotFoundException('Beta company profile not found');

    const currentIndex = ONBOARDING_STEPS.indexOf(profile.onboardingStep);
    const progress = Math.round(((currentIndex + 1) / ONBOARDING_STEPS.length) * 100);
    const completedSteps = ONBOARDING_STEPS.slice(0, currentIndex + 1);
    const remainingSteps = ONBOARDING_STEPS.slice(currentIndex + 1);

    return {
      currentStep: profile.onboardingStep,
      progress,
      completedSteps,
      remainingSteps,
      totalSteps: ONBOARDING_STEPS.length,
      onboardingCompletedAt: profile.onboardingCompletedAt,
    };
  }

  async getProductImportGuide(companyId: string) {
    const profile = await this.prisma.betaCompanyProfile.findUnique({
      where: { companyId },
    });
    if (!profile) throw new NotFoundException('Beta company profile not found');

    const stepIndex = ONBOARDING_STEPS.indexOf(profile.onboardingStep);
    const productStepIndex = ONBOARDING_STEPS.indexOf('PRODUCT_SETUP');

    const status =
      stepIndex < productStepIndex
        ? 'pending'
        : stepIndex === productStepIndex
          ? 'in_progress'
          : 'completed';

    return {
      status,
      currentStep: profile.onboardingStep,
      setupProgress: profile.setupProgress,
      nextSteps:
        status === 'pending'
          ? ['Complete previous onboarding steps to unlock product import']
          : status === 'in_progress'
            ? ['Add your first product catalog', 'Configure product categories', 'Set up pricing and inventory']
            : ['Product import completed', 'Proceed to RFQ configuration'],
    };
  }

  async getRfqGuide(companyId: string) {
    const profile = await this.prisma.betaCompanyProfile.findUnique({
      where: { companyId },
    });
    if (!profile) throw new NotFoundException('Beta company profile not found');

    const stepIndex = ONBOARDING_STEPS.indexOf(profile.onboardingStep);
    const rfqStepIndex = ONBOARDING_STEPS.indexOf('RFQ_CONFIGURATION');

    const status =
      stepIndex < rfqStepIndex
        ? 'pending'
        : stepIndex === rfqStepIndex
          ? 'in_progress'
          : 'completed';

    return {
      status,
      currentStep: profile.onboardingStep,
      setupProgress: profile.setupProgress,
      nextSteps:
        status === 'pending'
          ? ['Complete product setup to unlock RFQ configuration']
          : status === 'in_progress'
            ? ['Configure RFQ categories', 'Set default RFQ preferences', 'Define approval workflows']
            : ['RFQ configuration completed', 'Proceed to team invites'],
    };
  }

  // ──────────────── SUPPORT ────────────────

  async createTicket(dto: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    companyId: string;
    userId: string;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        category: dto.category,
        priority: dto.priority as any,
        companyId: dto.companyId,
        userId: dto.userId,
      },
    });
  }

  async getTickets(companyId?: string, filters?: { page?: number; limit?: number; status?: string }) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (filters?.status) where.status = filters.status as TicketStatus;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTicket(id: string) {
    const [ticket, messages] = await Promise.all([
      this.prisma.supportTicket.findUnique({ where: { id } }),
      this.prisma.supportTicketMessage.findMany({
        where: { ticketId: id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return { ...ticket, messages };
  }

  async addMessage(ticketId: string, dto: { message: string; attachments?: string[] }, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === 'CLOSED') throw new BadRequestException('Cannot add message to a closed ticket');

    return this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId,
        message: dto.message,
        attachments: dto.attachments ? (dto.attachments as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const data: Prisma.SupportTicketUpdateInput = { status };
    if (status === 'RESOLVED') data.resolvedAt = new Date();

    return this.prisma.supportTicket.update({
      where: { id },
      data,
    });
  }

  // ──────────────── METRICS ────────────────

  async recordMetric(companyId: string, name: string, value: number, metadata?: Record<string, unknown>) {
    return this.prisma.betaMetrics.create({
      data: {
        companyId,
        metricName: name,
        metricValue: value,
        metadata: this.jsonValue(metadata),
      },
    });
  }

  async getMetrics(companyId: string, names?: string[]) {
    const where: Prisma.BetaMetricsWhereInput = { companyId };
    if (names?.length) where.metricName = { in: names };

    const metrics = await this.prisma.betaMetrics.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    });

    const latest: Record<string, { value: number; recordedAt: Date; metadata?: unknown }> = {};
    for (const m of metrics) {
      if (!latest[m.metricName]) {
        latest[m.metricName] = { value: m.metricValue, recordedAt: m.recordedAt, metadata: m.metadata ?? undefined };
      }
    }

    return latest;
  }

  // ──────────────── DASHBOARD ────────────────

  async getDashboard(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [onboardingProfile, invites, recentErrors, recentTickets, usageCount, metrics] =
      await Promise.all([
        this.prisma.betaCompanyProfile.findUnique({ where: { companyId } }),
        this.prisma.betaInvite.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.errorEvent.findMany({
          where: { companyId, resolved: false },
          orderBy: { timestamp: 'desc' },
          take: 5,
        }),
        this.prisma.supportTicket.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.usageEvent.count({
          where: { companyId, timestamp: { gte: thirtyDaysAgo } },
        }),
        this.getMetrics(companyId),
      ]);

    return {
      onboarding: onboardingProfile
        ? {
            currentStep: onboardingProfile.onboardingStep,
            progress: onboardingProfile.setupProgress,
            completedAt: onboardingProfile.onboardingCompletedAt,
            goLiveAt: onboardingProfile.goLiveAt,
          }
        : null,
      invites,
      recentErrors,
      recentTickets,
      usageStats: { last30Days: usageCount },
      metrics,
    };
  }
}
