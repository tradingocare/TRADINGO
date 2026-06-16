import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { EscrowAnalyticsService } from './escrow-analytics.service';
import { QueryEscrowDto } from './dto/escrow.dto';
import { NotificationType, EscrowEventType } from '@prisma/client';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly escrowAnalyticsService: EscrowAnalyticsService,
  ) {}

  async hold(orderId: string, companyId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) throw new NotFoundException('Order not found');
    if (order.buyerCompanyId !== companyId && order.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    const existing = await this.prisma.escrow.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Escrow already exists for this order');

    const amount = Math.round(Number(order.totalAmount) * 100);
    const goCashAmount = 0;
    const netAmount = amount - goCashAmount;

    const escrow = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.create({
        data: {
          orderId,
          buyerCompanyId: order.buyerCompanyId,
          sellerCompanyId: order.sellerCompanyId,
          amount,
          goCashAmount,
          netAmount,
          status: 'HELD',
          heldAt: new Date(),
        },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId: e.id,
          type: EscrowEventType.ESCROW_HELD,
          createdById: userId,
        },
      });

      return e;
    });

    await this.escrowAnalyticsService.trackEvent(companyId, escrow.id, 'ESCROW_HELD', {
      orderId,
      amount,
      netAmount,
    });

    try {
      await this.notificationService.createWithTemplate(
        order.sellerCompanyId,
        undefined,
        NotificationType.ESCROW_HELD,
        { orderNumber: order.orderNumber, amount, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to send ESCROW_HELD notification: ${(err as Error).message}`);
    }

    return escrow;
  }

  async getEscrow(escrowId: string, companyId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerCompanyId !== companyId && escrow.sellerCompanyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    return escrow;
  }

  async findAll(companyId: string, query: QueryEscrowDto) {
    const where: any = {
      OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
    };

    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          settlements: true,
        },
      }),
      this.prisma.escrow.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async getSellerDashboard(companyId: string) {
    const escrows = await this.prisma.escrow.findMany({
      where: { sellerCompanyId: companyId },
      include: {
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const held = escrows.filter((e) => e.status === 'HELD');
    const released = escrows.filter((e) => e.status === 'RELEASED');
    const pending = escrows.filter((e) => ['HELD', 'PARTIALLY_RELEASED', 'REFUND_PENDING', 'DISPUTED', 'FROZEN', 'MANUAL_REVIEW'].includes(e.status));

    const totalReleasedAmount = released.reduce((sum, e) => sum + e.netAmount, 0);

    const escrowsWithCountdown = escrows.map((e) => {
      let releaseCountdown: number | null = null;
      if (e.status === 'HELD' && e.autoReleaseAt) {
        releaseCountdown = Math.max(0, Math.floor((e.autoReleaseAt.getTime() - Date.now()) / 1000));
      }
      return { ...e, releaseCountdown };
    });

    return {
      totalEscrows: escrows.length,
      heldCount: held.length,
      releasedCount: released.length,
      totalReleasedAmount,
      pendingSettlementCount: pending.length,
      escrows: escrowsWithCountdown,
    };
  }

  async freeze(escrowId: string, companyId: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED') {
      throw new BadRequestException('Escrow must be in HELD or DISPUTED status to freeze');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'FROZEN', frozenAt: new Date() },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId,
          type: EscrowEventType.ESCROW_FROZEN,
          createdById: userId,
        },
      });

      return e;
    });

    await this.escrowAnalyticsService.trackEvent(companyId, escrowId, 'ESCROW_FROZEN', {
      previousStatus: escrow.status,
    });

    return updated;
  }

  async refund(escrowId: string, companyId: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (!['HELD', 'DISPUTED', 'FROZEN'].includes(escrow.status)) {
      throw new BadRequestException('Escrow must be in HELD, DISPUTED, or FROZEN status to refund');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId,
          type: EscrowEventType.ESCROW_REFUNDED,
          createdById: userId,
        },
      });

      return e;
    });

    await this.escrowAnalyticsService.trackEvent(companyId, escrowId, 'ESCROW_REFUNDED', {
      amount: escrow.amount,
      orderId: escrow.orderId,
    });

    try {
      await this.notificationService.createWithTemplate(
        escrow.buyerCompanyId,
        undefined,
        NotificationType.ESCROW_REFUNDED,
        { orderNumber: escrow.order.orderNumber, amount: escrow.amount, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to send ESCROW_REFUNDED notification: ${(err as Error).message}`);
    }

    return updated;
  }

  async reopen(escrowId: string, companyId: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.status !== 'FROZEN') throw new BadRequestException('Only frozen escrows can be reopened');

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'HELD', frozenAt: null },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId,
          type: EscrowEventType.ESCROW_REOPENED,
          createdById: userId,
        },
      });

      return e;
    });

    await this.escrowAnalyticsService.trackEvent(companyId, escrowId, 'ESCROW_REOPENED');

    return updated;
  }

  async setAutoReleaseDate(escrowId: string, deliveredAt: Date) {
    const autoReleaseAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000);
    return this.prisma.escrow.update({
      where: { id: escrowId },
      data: { autoReleaseAt },
    });
  }

  async release(escrowId: string, companyId: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.status !== 'HELD') throw new BadRequestException('Escrow must be in HELD status to release');

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId,
          type: EscrowEventType.ESCROW_RELEASED,
          createdById: userId,
        },
      });

      return e;
    });

    await this.escrowAnalyticsService.trackEvent(companyId, escrowId, 'ESCROW_RELEASED', {
      amount: escrow.amount,
      netAmount: escrow.netAmount,
    });

    try {
      await this.notificationService.createWithTemplate(
        escrow.sellerCompanyId,
        undefined,
        NotificationType.ESCROW_RELEASED,
        { orderNumber: escrow.order.orderNumber, amount: escrow.netAmount, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to send ESCROW_RELEASED notification: ${(err as Error).message}`);
    }

    return updated;
  }

  async processAutoRelease() {
    const now = new Date();
    const escrows = await this.prisma.escrow.findMany({
      where: {
        status: 'HELD',
        autoReleaseAt: { lte: now },
      },
    });

    this.logger.log(`Processing auto-release for ${escrows.length} escrows`);

    const results: { escrowId: string; orderId: string; success: boolean; error?: string }[] = [];

    for (const escrow of escrows) {
      try {
        await this.release(escrow.id, escrow.sellerCompanyId, 'system-auto-release');
        results.push({ escrowId: escrow.id, orderId: escrow.orderId, success: true });
        this.logger.log(`Auto-released escrow ${escrow.id} for order ${escrow.orderId}`);
      } catch (err) {
        results.push({ escrowId: escrow.id, orderId: escrow.orderId, success: false, error: (err as Error).message });
        this.logger.error(`Auto-release failed for escrow ${escrow.id}: ${(err as Error).message}`);
      }
    }

    return { processed: results.length, succeeded: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
  }

  async getStats(companyId: string) {
    return this.escrowAnalyticsService.getEscrowMetrics(companyId);
  }
}
