import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { DisputeAnalyticsService } from './dispute-analytics.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { AdminAssignmentService } from './admin-assignment.service';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  private readonly STATUS_FLOW: Record<string, string[]> = {
    OPEN: ['UNDER_REVIEW', 'EVIDENCE_PENDING', 'CANCELLED'],
    UNDER_REVIEW: ['EVIDENCE_PENDING', 'NEGOTIATION', 'ESCALATED', 'ADMIN_ARBITRATION', 'RESOLVED', 'REJECTED'],
    EVIDENCE_PENDING: ['UNDER_REVIEW', 'NEGOTIATION', 'CANCELLED'],
    NEGOTIATION: ['UNDER_REVIEW', 'ESCALATED', 'PARTIALLY_RESOLVED', 'RESOLVED', 'CANCELLED'],
    ESCALATED: ['ADMIN_ARBITRATION', 'RESOLVED', 'REJECTED'],
    ADMIN_ARBITRATION: ['RESOLVED', 'PARTIALLY_RESOLVED', 'REFUNDED', 'REJECTED'],
    PARTIALLY_RESOLVED: ['RESOLVED', 'REFUNDED', 'REJECTED'],
    RESOLVED: ['APPEALED', 'CANCELLED'],
    REFUNDED: ['CANCELLED'],
    REJECTED: ['APPEALED', 'CANCELLED'],
    APPEALED: ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
    CANCELLED: [],
    EXPIRED: [],
  };

  private readonly TIMESTAMP_FIELD: Record<string, string> = {
    UNDER_REVIEW: 'underReviewAt',
    ESCALATED: 'escalatedAt',
    RESOLVED: 'resolvedAt',
    REJECTED: 'rejectedAt',
    REFUNDED: 'refundedAt',
    CANCELLED: 'cancelledAt',
    EXPIRED: 'expiredAt',
    APPEALED: 'appealedAt',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly disputeAnalyticsService: DisputeAnalyticsService,
    private readonly adminAssignmentService: AdminAssignmentService,
    @InjectQueue('dispute') private readonly disputeQueue: Queue,
  ) {}

  async create(
    companyId: string,
    userId: string,
    dto: any,
  ): Promise<any> {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');

    const isBuyer = order.buyerCompanyId === companyId;
    const isSeller = order.sellerCompanyId === companyId;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Access denied');

    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      const productLimit = 7;
      const serviceLimit = 30;
      const isService = order.type === 'SERVICE';
      const limit = isService ? serviceLimit : productLimit;

      if (daysSinceDelivery > limit) {
        throw new BadRequestException(
          `Dispute time limit exceeded. ${isService ? 'Service' : 'Product'} orders must be disputed within ${limit} days of delivery`,
        );
      }
    }

    const againstCompanyId = isBuyer ? order.sellerCompanyId : order.buyerCompanyId;

    const disputeNumber = `DSP-${order.orderNumber}-${Math.floor(
      Math.random() * 9000 + 1000,
    )}`;

    const escrow = await this.prisma.escrow.findUnique({ where: { orderId: dto.orderId } });

    const dispute = await this.prisma.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          disputeNumber,
          orderId: dto.orderId,
          escrowId: escrow?.id ?? null,
          raisedByCompanyId: companyId,
          againstCompanyId,
          type: dto.type,
          reason: dto.reason,
          description: dto.description,
          amount: dto.amount ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId: d.id,
          type: 'DISPUTE_CREATED',
          description: 'Dispute filed',
          createdBy: userId,
        },
      });

      if (escrow && (escrow.status === 'HELD' || escrow.status === 'PARTIALLY_RELEASED')) {
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'DISPUTED',
            disputedAmount: dto.amount ?? escrow.amount,
            disputedAt: new Date(),
          },
        });
      }

      return d;
    });

    try {
      await this.notificationService.createWithTemplate(
        againstCompanyId,
        undefined,
        'DISPUTE_CREATED' as any,
        {
          disputeNumber,
          orderNumber: order.orderNumber,
          type: dto.type,
          reason: dto.reason,
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to send DISPUTE_CREATED notification: ${(err as Error).message}`);
    }

    await this.disputeAnalyticsService.trackEvent(
      companyId,
      dispute.id,
      'DISPUTE_CREATED',
      { orderId: dto.orderId, type: dto.type, reason: dto.reason },
    );

    return this.prisma.dispute.findUnique({
      where: { id: dispute.id },
      include: {
        order: { select: { orderNumber: true } },
        messages: true,
        evidence: true,
        timeline: true,
        resolution: true,
        appeal: true,
      },
    });
  }

  async findAll(companyId: string, query: any) {
    const where: any = {
      OR: [{ raisedByCompanyId: companyId }, { againstCompanyId: companyId }],
    };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          resolution: true,
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async getDispute(disputeId: string, companyId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: { select: { orderNumber: true } },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
        evidence: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        resolution: true,
        appeal: true,
      },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return dispute;
  }

  async updateStatus(
    disputeId: string,
    companyId: string,
    userId: string,
    dto: any,
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const allowed = this.STATUS_FLOW[dispute.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${dispute.status} to ${dto.status}`,
      );
    }

    const timestampField = this.TIMESTAMP_FIELD[dto.status];
    const updateData: any = { status: dto.status, updatedBy: userId };
    if (timestampField) updateData[timestampField] = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: updateData,
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: `DISPUTE_${dto.status}`,
          description: dto.description ?? `Status changed from ${dispute.status} to ${dto.status}`,
          createdBy: userId,
        },
      });

      const escrow = await tx.escrow.findUnique({ where: { orderId: dispute.orderId } });
      if (escrow) {
        if (dto.status === 'RESOLVED' || dto.status === 'PARTIALLY_RESOLVED') {
          const resolutionAction = dto.status === 'RESOLVED' ? 'RELEASED' : 'PARTIALLY_RELEASED';
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: resolutionAction, releasedAt: new Date(), disputedAmount: null, disputedAt: null },
          });
        } else if (dto.status === 'REFUNDED') {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'REFUNDED', refundedAt: new Date(), disputedAmount: null, disputedAt: null },
          });
        } else if (dto.status === 'REJECTED') {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'HELD', disputedAt: null, disputedAmount: null },
          });
        }
      }

      return updated;
    });

    if (dto.status === 'RESOLVED' || dto.status === 'REFUNDED') {
      try {
        await this.notificationService.createWithTemplate(
          dispute.raisedByCompanyId,
          undefined,
          'DISPUTE_RESOLVED' as any,
          { disputeNumber: dispute.disputeNumber, status: dto.status },
        );
      } catch (err) {
        this.logger.warn(`Failed to send DISPUTE_RESOLVED notification: ${(err as Error).message}`);
      }

      try {
        await this.prisma.company.update({
          where: { id: dispute.againstCompanyId },
          data: { trustScore: { decrement: 10 } },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to update trust score for company ${dispute.againstCompanyId}: ${(err as Error).message}`,
        );
      }
    } else if (dto.status === 'REJECTED') {
      try {
        await this.notificationService.createWithTemplate(
          dispute.raisedByCompanyId,
          undefined,
          'DISPUTE_REJECTED' as any,
          { disputeNumber: dispute.disputeNumber },
        );
      } catch (err) {
        this.logger.warn(`Failed to send DISPUTE_REJECTED notification: ${(err as Error).message}`);
      }
    }

    await this.disputeAnalyticsService.trackEvent(
      companyId,
      disputeId,
      `DISPUTE_${dto.status}`,
      { previousStatus: dispute.status },
    );

    return result;
  }

  async addMessage(disputeId: string, companyId: string, userId: string, dto: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { messages: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.disputeMessage.create({
        data: { disputeId, senderId: userId, content: dto.content },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'MESSAGE_ADDED',
          description: 'Message added to dispute',
          createdBy: userId,
        },
      });

      return msg;
    });

    const otherParty = dispute.raisedByCompanyId === companyId ? dispute.againstCompanyId : dispute.raisedByCompanyId;
    try {
      await this.notificationService.createWithTemplate(
        otherParty,
        undefined,
        'DISPUTE_UPDATED' as any,
        { disputeNumber: dispute.disputeNumber, message: 'New message added to dispute' },
      );
    } catch (err) {
      this.logger.warn(`Failed to send DISPUTE_UPDATED notification: ${(err as Error).message}`);
    }

    return message;
  }

  async addEvidence(disputeId: string, companyId: string, userId: string, dto: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { evidence: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (dispute.evidence.length >= 10) {
      throw new BadRequestException('Maximum 10 evidence files allowed per dispute');
    }

    const currentTotalSize = dispute.evidence.reduce(
      (sum, e) => sum + (e.fileSize ?? 0),
      0,
    );
    if (currentTotalSize + (dto.fileSize ?? 0) > 100 * 1024 * 1024) {
      throw new BadRequestException('Total evidence file size cannot exceed 100MB');
    }

    const evidence = await this.prisma.$transaction(async (tx) => {
      const ev = await tx.disputeEvidence.create({
        data: {
          disputeId,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType ?? null,
          fileSize: dto.fileSize ?? null,
          uploadedBy: userId,
        },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'EVIDENCE_ADDED',
          description: `Evidence uploaded: ${dto.fileName}`,
          createdBy: userId,
        },
      });

      if (dispute.status === 'OPEN') {
        await tx.dispute.update({
          where: { id: disputeId },
          data: { status: 'EVIDENCE_PENDING', updatedBy: userId },
        });
      }

      return ev;
    });

    const otherParty = dispute.raisedByCompanyId === companyId ? dispute.againstCompanyId : dispute.raisedByCompanyId;

    try {
      await this.notificationService.createWithTemplate(
        otherParty,
        undefined,
        'DISPUTE_EVIDENCE_REQUIRED' as any,
        { disputeNumber: dispute.disputeNumber, fileName: dto.fileName },
      );
    } catch (err) {
      this.logger.warn(`Failed to send DISPUTE_EVIDENCE_REQUIRED notification: ${(err as Error).message}`);
    }

    return evidence;
  }

  async escalate(disputeId: string, companyId: string, userId: string, dto?: any) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const allowed = this.STATUS_FLOW[dispute.status] ?? [];
    if (!allowed.includes('ESCALATED')) {
      throw new BadRequestException(`Cannot escalate dispute from ${dispute.status}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'ESCALATED', escalatedAt: new Date(), updatedBy: userId },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'DISPUTE_ESCALATED',
          description: dto?.reason ?? 'Dispute escalated to admin',
          createdBy: userId,
          metadata: dto?.reason ? { reason: dto.reason } as any : null,
        },
      });

      await this.disputeQueue.add('admin-arbitration', { disputeId }, { delay: 7 * 24 * 60 * 60 * 1000 });

      return updated;
    });

    try {
      await this.notificationService.createWithTemplate(
        dispute.againstCompanyId,
        undefined,
        'DISPUTE_ESCALATED' as any,
        { disputeNumber: dispute.disputeNumber, reason: dto?.reason ?? 'Escalated to admin' },
      );
    } catch (err) {
      this.logger.warn(`Failed to send DISPUTE_ESCALATED notification: ${(err as Error).message}`);
    }

    await this.disputeAnalyticsService.trackEvent(
      companyId,
      disputeId,
      'DISPUTE_ESCALATED',
      { reason: dto?.reason },
    );

    return result;
  }

  async resolveDispute(disputeId: string, userId: string, dto: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { resolution: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.resolution) throw new BadRequestException('Dispute already has a resolution');

    const targetStatus =
      dto.refundAmount
        ? 'REFUNDED'
        : dto.resolutionType === 'FULL_REFUND' || dto.resolutionType === 'PARTIAL_REFUND'
        ? 'REFUNDED'
        : 'RESOLVED';

    const result = await this.prisma.$transaction(async (tx) => {
      const resolution = await tx.disputeResolution.create({
        data: {
          disputeId,
          resolutionType: dto.resolutionType,
          description: dto.description ?? null,
          refundAmount: dto.refundAmount ?? null,
          replacementInfo: dto.replacementInfo ?? null,
          priceAdjustment: dto.priceAdjustment ?? null,
          approvedBy: userId,
        },
      });

      const timestampField = targetStatus === 'REFUNDED' ? 'refundedAt' : 'resolvedAt';
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: targetStatus as any,
          [timestampField]: new Date(),
          updatedBy: userId,
        },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: `DISPUTE_${targetStatus}`,
          description: `Resolution: ${dto.resolutionType}${dto.description ? ' - ' + dto.description : ''}`,
          createdBy: userId,
        },
      });

      const escrow = await tx.escrow.findUnique({ where: { orderId: dispute.orderId } });
      if (escrow) {
        if (targetStatus === 'REFUNDED') {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: {
              status: 'REFUNDED',
              refundedAt: new Date(),
              disputedAmount: null,
              disputedAt: null,
            },
          });
        } else {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'RELEASED', releasedAt: new Date(), disputedAmount: null, disputedAt: null },
          });
        }
      }

      return { resolution, dispute: updated };
    });

    try {
      await this.notificationService.createWithTemplate(
        dispute.raisedByCompanyId,
        undefined,
        targetStatus === 'REFUNDED'
          ? 'DISPUTE_REFUNDED' as any
          : 'DISPUTE_RESOLVED' as any,
        {
          disputeNumber: dispute.disputeNumber,
          resolutionType: dto.resolutionType,
          refundAmount: dto.refundAmount,
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to send resolution notification: ${(err as Error).message}`);
    }

    try {
      await this.prisma.company.update({
        where: { id: dispute.againstCompanyId },
        data: { trustScore: { decrement: 10 } },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to update trust score for company ${dispute.againstCompanyId}: ${(err as Error).message}`,
      );
    }

    await this.disputeAnalyticsService.trackEvent(dispute.raisedByCompanyId, disputeId, `DISPUTE_${targetStatus}`, {
      resolutionType: dto.resolutionType,
    });
    await this.disputeAnalyticsService.trackEvent(dispute.againstCompanyId, disputeId, `DISPUTE_${targetStatus}`, {
      resolutionType: dto.resolutionType,
    });

    return result;
  }

  async appeal(disputeId: string, companyId: string, userId: string, dto: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { appeal: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.raisedByCompanyId !== companyId &&
      dispute.againstCompanyId !== companyId
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED') {
      throw new BadRequestException('Only resolved or rejected disputes can be appealed');
    }
    if (dispute.appeal) throw new BadRequestException('Dispute already has an appeal');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.disputeAppeal.create({
        data: {
          disputeId,
          reason: dto.reason,
          supportingInfo: dto.supportingInfo ?? null,
          filedBy: userId,
        },
      });

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'APPEALED', appealedAt: new Date(), updatedBy: userId },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'DISPUTE_APPEALED',
          description: `Appeal filed: ${dto.reason}`,
          createdBy: userId,
        },
      });

      return updated;
    });

    try {
      await this.notificationService.createWithTemplate(
        dispute.againstCompanyId,
        undefined,
        'DISPUTE_APPEALED' as any,
        { disputeNumber: dispute.disputeNumber, reason: dto.reason },
      );
    } catch (err) {
      this.logger.warn(`Failed to send DISPUTE_APPEALED notification: ${(err as Error).message}`);
    }

    await this.disputeAnalyticsService.trackEvent(companyId, disputeId, 'DISPUTE_APPEALED', { reason: dto.reason });

    return result;
  }

  async reviewAppeal(disputeId: string, userId: string, dto: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { appeal: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (!dispute.appeal) throw new BadRequestException('No appeal found for this dispute');

    const accepted = dto.decision === 'ACCEPTED' || dto.decision === 'accepted';
    const newStatus = accepted ? 'UNDER_REVIEW' : (dispute.status === 'APPEALED' ? 'RESOLVED' : dispute.status as any);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.disputeAppeal.update({
        where: { id: dispute.appeal!.id },
        data: {
          status: dto.status ?? (accepted ? 'ACCEPTED' : 'REJECTED'),
          decision: dto.decision,
          decisionNotes: dto.decisionNotes ?? null,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: newStatus as any, updatedBy: userId },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'APPEAL_REVIEWED',
          description: `Appeal ${accepted ? 'accepted' : 'rejected'}: ${dto.decisionNotes ?? ''}`,
          createdBy: userId,
        },
      });

      return updated;
    });

    await this.disputeAnalyticsService.trackEvent(dispute.raisedByCompanyId, disputeId, 'APPEAL_REVIEWED', { decision: dto.decision });

    return result;
  }

  async getDisputeNumber(orderId: string, stateCode: string) {
    const now = new Date();
    const yymmdd = now.getFullYear().toString().slice(2) + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const sc = (stateCode ?? 'XX').substring(0, 2).toUpperCase();

    const counter = await this.prisma.orderNumberCounter.upsert({
      where: { id: `DSP-${sc}-${yymmdd}` },
      create: { id: `DSP-${sc}-${yymmdd}`, stateCode: sc, date: yymmdd, seq: 1 },
      update: { seq: { increment: 1 } },
    });

    const seq = counter.seq.toString().padStart(4, '0');
    return `DSP-${sc}-${yymmdd}-${seq}`;
  }

  async getStats(companyId: string) {
    return this.disputeAnalyticsService.getDisputeMetrics(companyId);
  }

  async processExpiredDisputes() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredStatuses: any = ['OPEN', 'EVIDENCE_PENDING', 'NEGOTIATION'];

    const disputes = await this.prisma.dispute.findMany({
      where: {
        status: { in: expiredStatuses },
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Found ${disputes.length} disputes to expire`);

    let expiredCount = 0;
    for (const dispute of disputes) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.dispute.update({
            where: { id: dispute.id },
            data: { status: 'EXPIRED', expiredAt: new Date(), updatedBy: 'system' },
          });

          await tx.disputeTimelineEvent.create({
            data: {
              disputeId: dispute.id,
              type: 'DISPUTE_EXPIRED',
              description: 'Dispute expired due to inactivity',
              createdBy: 'system',
            },
          });
        });
        expiredCount++;
      } catch (err) {
        this.logger.error(`Failed to expire dispute ${dispute.id}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Expired ${expiredCount}/${disputes.length} disputes`);
    return { processed: disputes.length, expired: expiredCount };
  }

  async adminArbitration(disputeId: string, jobId?: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { order: true, escrow: true },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.status !== 'ESCALATED') {
      this.logger.warn(`Admin arbitration invoked for dispute ${disputeId} in status ${dispute.status}`);
      return;
    }

    if (jobId) {
      const existing = await this.prisma.disputeProcessorExecution.findUnique({
        where: { jobId },
      });
      if (existing) {
        this.logger.warn(`Admin arbitration job ${jobId} already processed for dispute ${disputeId}`);
        return;
      }
    }

    const admin = await this.adminAssignmentService.assignArbitrator(disputeId);

    await this.prisma.$transaction(async (tx) => {
      const arbitrationDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'ADMIN_ARBITRATION',
          assignedAdminId: admin.adminId,
          assignedAt: new Date(),
          arbitrationDueAt: arbitrationDue,
          assignmentReason: admin.reason,
          updatedBy: 'system',
        },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'ADMIN_ARBITRATION_STARTED',
          description: 'Dispute moved to admin arbitration',
          createdBy: 'system',
        },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'ARBITRATOR_ASSIGNED',
          description: `Arbitrator assigned via ${admin.reason}`,
          createdBy: 'system',
          metadata: { adminId: admin.adminId } as any,
        },
      });

      if (jobId) {
        await tx.disputeProcessorExecution.create({
          data: {
            jobId,
            disputeId,
            type: 'ADMIN_ARBITRATION',
          },
        });
      }
    });

    await this.disputeQueue.add(
      'arbitration-sla-breach',
      { disputeId },
      { delay: 14 * 24 * 60 * 60 * 1000 },
    );

    try {
      await this.notificationService.createWithTemplate(
        dispute.raisedByCompanyId,
        undefined,
        'DISPUTE_ESCALATED' as any,
        { disputeNumber: dispute.disputeNumber, reason: 'Admin arbitration started' },
      );
      await this.notificationService.createWithTemplate(
        dispute.againstCompanyId,
        undefined,
        'DISPUTE_ESCALATED' as any,
        { disputeNumber: dispute.disputeNumber, reason: 'Admin arbitration started' },
      );
    } catch (err) {
      this.logger.warn(`Failed to send admin arbitration notifications: ${(err as Error).message}`);
    }

    await this.disputeAnalyticsService.trackEvent(
      dispute.raisedByCompanyId,
      disputeId,
      'ARBITRATION_STARTED',
      { assignedAdminId: admin.adminId },
    );
    await this.disputeAnalyticsService.trackEvent(
      dispute.againstCompanyId,
      disputeId,
      'ARBITRATION_STARTED',
      { assignedAdminId: admin.adminId },
    );

    this.logger.log(`Admin arbitration started for dispute ${disputeId}, assigned to admin ${admin.adminId}`);
  }

  async handleArbitrationSlaBreach(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.status !== 'ADMIN_ARBITRATION') {
      this.logger.warn(`SLA breach handler invoked for dispute ${disputeId} in status ${dispute.status}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: 'ESCALATED', updatedBy: 'system' },
      });

      await tx.disputeTimelineEvent.create({
        data: {
          disputeId,
          type: 'ARBITRATION_SLA_BREACH',
          description: 'Arbitration SLA breached — 14 days exceeded. Escalated to Super Admin.',
          createdBy: 'system',
        },
      });
    });

    try {
      await this.notificationService.createWithTemplate(
        dispute.raisedByCompanyId,
        undefined,
        'DISPUTE_ARBITRATION_OVERDUE' as any,
        { disputeNumber: dispute.disputeNumber },
      );
      await this.notificationService.createWithTemplate(
        dispute.againstCompanyId,
        undefined,
        'DISPUTE_ARBITRATION_OVERDUE' as any,
        { disputeNumber: dispute.disputeNumber },
      );
    } catch (err) {
      this.logger.warn(`Failed to send arbitration overdue notifications: ${(err as Error).message}`);
    }

    await this.disputeAnalyticsService.trackEvent(
      dispute.raisedByCompanyId,
      disputeId,
      'ARBITRATION_SLA_BREACH',
      {},
    );
    await this.disputeAnalyticsService.trackEvent(
      dispute.againstCompanyId,
      disputeId,
      'ARBITRATION_SLA_BREACH',
      {},
    );

    this.logger.log(`Arbitration SLA breached for dispute ${disputeId}`);
  }
}
