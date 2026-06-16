import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SettlementAnalyticsService } from './settlement-analytics.service';
import { QuerySettlementDto } from './dto/settlement.dto';
import { NotificationType, SettlementEventType, SettlementStatus } from '@prisma/client';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly settlementAnalyticsService: SettlementAnalyticsService,
  ) {}

  async create(escrowId: string, companyId: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.status !== 'RELEASED') throw new BadRequestException('Escrow must be in RELEASED status');

    const activeSettlement = await this.prisma.settlement.findFirst({
      where: { escrowId, status: { in: ['PENDING', 'PROCESSING', 'RETRYING'] as SettlementStatus[] } },
    });
    if (activeSettlement) throw new BadRequestException('An active settlement already exists for this escrow');

    const settlement = await this.prisma.$transaction(async (tx) => {
      const s = await tx.settlement.create({
        data: {
          escrowId,
          amount: escrow.netAmount,
          status: 'PENDING',
          createdById: userId,
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId: s.id,
          type: 'SETTLEMENT_CREATED' as SettlementEventType,
          createdById: userId,
        },
      });

      return s;
    });

    await this.settlementAnalyticsService.trackEvent(escrow.sellerCompanyId, settlement.id, 'SETTLEMENT_CREATED', {
      escrowId, amount: escrow.netAmount,
    });

    return settlement;
  }

  async findAll(companyId: string, query: QuerySettlementDto) {
    const where: any = {
      escrow: {
        OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
      },
    };
    if (query.status) where.status = query.status;

    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        include: { escrow: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async getSettlement(settlementId: string, companyId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        escrow: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!settlement) throw new NotFoundException('Settlement not found');

    const { escrow } = settlement;
    if (escrow.buyerCompanyId !== companyId && escrow.sellerCompanyId !== companyId) {
      throw new NotFoundException('Settlement not found');
    }

    return settlement;
  }

  async process(settlementId: string, userId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { escrow: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status !== 'PENDING' && settlement.status !== 'RETRYING') {
      throw new BadRequestException('Settlement must be in PENDING or RETRYING status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          settledAt: new Date(),
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          type: 'SETTLEMENT_PROCESSED' as SettlementEventType,
          createdById: userId,
        },
      });

      return s;
    });

    await this.settlementAnalyticsService.trackEvent(settlement.escrow.sellerCompanyId, settlementId, 'SETTLEMENT_PROCESSED', {
      amount: settlement.amount,
    });

    try {
      await this.notificationService.createWithTemplate(
        settlement.escrow.sellerCompanyId,
        undefined,
        NotificationType.SETTLEMENT_PROCESSED,
        { settlementId, escrowId: settlement.escrowId, amount: settlement.amount, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to send SETTLEMENT_PROCESSED: ${(err as Error).message}`);
    }

    return updated;
  }

  async fail(settlementId: string, reason: string, userId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { escrow: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failedReason: reason,
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          type: 'SETTLEMENT_FAILED' as SettlementEventType,
          metadata: { reason },
          createdById: userId,
        },
      });

      return s;
    });

    await this.settlementAnalyticsService.trackEvent(settlement.escrow.sellerCompanyId, settlementId, 'SETTLEMENT_FAILED', {
      reason,
    });

    try {
      await this.notificationService.createWithTemplate(
        settlement.escrow.sellerCompanyId,
        undefined,
        NotificationType.SETTLEMENT_FAILED,
        { settlementId, escrowId: settlement.escrowId, reason, createdById: userId },
      );
    } catch (err) {
      this.logger.warn(`Failed to send SETTLEMENT_FAILED: ${(err as Error).message}`);
    }

    return updated;
  }

  async retry(settlementId: string, userId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { escrow: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status !== 'FAILED') throw new BadRequestException('Settlement must be in FAILED status');

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'RETRYING',
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          type: 'SETTLEMENT_RETRYING' as SettlementEventType,
          createdById: userId,
        },
      });

      return s;
    });

    await this.settlementAnalyticsService.trackEvent(settlement.escrow.sellerCompanyId, settlementId, 'SETTLEMENT_RETRYING', {
      retryCount: settlement.retryCount + 1,
    });

    return updated;
  }

  async reopen(settlementId: string, userId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { escrow: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status !== 'PROCESSED' && settlement.status !== 'CANCELLED') {
      throw new BadRequestException('Settlement must be in PROCESSED or CANCELLED status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.settlement.update({
        where: { id: settlementId },
        data: { status: 'REOPENED' },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          type: 'SETTLEMENT_REOPENED' as SettlementEventType,
          createdById: userId,
        },
      });

      return s;
    });

    await this.settlementAnalyticsService.trackEvent(settlement.escrow.sellerCompanyId, settlementId, 'SETTLEMENT_REOPENED');

    return updated;
  }

  async processSettlements() {
    const pending = await this.prisma.settlement.findMany({
      where: { status: 'PENDING' },
    });

    const systemUserId = 'SYSTEM';
    let processed = 0;
    let failed = 0;

    for (const settlement of pending) {
      try {
        await this.process(settlement.id, systemUserId);
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process settlement ${settlement.id}: ${(err as Error).message}`);
        failed++;
      }
    }

    this.logger.log(`processSettlements: ${processed} processed, ${failed} failed out of ${pending.length}`);
    return { total: pending.length, processed, failed };
  }

  async processRetries() {
    const failed = await this.prisma.settlement.findMany({
      where: { status: 'FAILED', retryCount: { lt: 3 } },
    });

    const systemUserId = 'SYSTEM';
    let retried = 0;
    let processed = 0;
    let errors = 0;

    for (const settlement of failed) {
      try {
        await this.retry(settlement.id, systemUserId);
        retried++;
        await this.process(settlement.id, systemUserId);
        processed++;
      } catch (err) {
        this.logger.error(`Failed to retry settlement ${settlement.id}: ${(err as Error).message}`);
        errors++;
      }
    }

    this.logger.log(`processRetries: ${retried} retried, ${processed} processed, ${errors} errors out of ${failed.length}`);
    return { total: failed.length, retried, processed, errors };
  }
}
