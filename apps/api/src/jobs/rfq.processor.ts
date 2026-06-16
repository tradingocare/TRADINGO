import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames, RfqJobTypes, RfqJobData } from './queues';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../modules/notification/notification.service';
import { NotificationType } from '@prisma/client';

@Processor(QueueNames.RFQ, { concurrency: 5, lockDuration: 30000 })
export class RfqProcessor extends WorkerHost {
  private readonly logger = new Logger(RfqProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<RfqJobData>): Promise<void> {
    switch (job.data.type) {
      case RfqJobTypes.EXPIRE_RFQS:
        await this.expireRfqs();
        break;
      case RfqJobTypes.EXPIRE_CREDIT_PACKS:
        await this.expireCreditPacks();
        break;
      case RfqJobTypes.EXPIRE_QUOTES:
        await this.expireQuotes();
        break;
    }
  }

  private async expireRfqs() {
    const now = new Date();
    const expired = await this.prisma.rfq.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now }, deletedAt: null },
      data: { status: 'EXPIRED' },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} RFQs`);

      const rfqs = await this.prisma.rfq.findMany({
        where: { status: 'EXPIRED', expiresAt: { lte: now } },
        select: { id: true, companyId: true, createdBy: true, title: true },
      });

      await this.prisma.rfqAnalyticsEvent.createMany({
        data: rfqs.map((r: { id: string; companyId: string }) => ({
          companyId: r.companyId,
          rfqId: r.id,
          eventType: 'EXPIRED',
          metadata: { reason: 'auto_expiry' },
        })),
      });

      for (const rfq of rfqs) {
        await this.notificationService.createWithTemplate(
          rfq.companyId,
          rfq.createdBy,
          NotificationType.RFQ_EXPIRED,
          { rfqTitle: rfq.title },
        ).catch((err: Error) =>
          this.logger.error(`Failed to send RFQ_EXPIRED notification for ${rfq.id}: ${err.message}`),
        );
      }
    }
  }

  private async expireCreditPacks() {
    const now = new Date();

    const packs = await this.prisma.rfqCreditPack.findMany({
      where: { isActive: true, expiresAt: { lte: now } },
    });

    for (const pack of packs) {
      const usedSum = await this.prisma.rfqCreditLedger.aggregate({
        where: { packId: pack.id, type: 'USED' },
        _sum: { amount: true },
      });
      const unused = pack.credits - (usedSum._sum.amount ?? 0);

      if (unused > 0) {
        await this.prisma.rfqCreditLedger.create({
          data: {
            companyId: pack.companyId,
            type: 'EXPIRED',
            amount: unused,
            balanceBefore: 0,
            balanceAfter: 0,
            packId: pack.id,
            description: `Credit pack expired at month end`,
          },
        });
      }

      await this.prisma.rfqCreditPack.update({
        where: { id: pack.id },
        data: { isActive: false },
      });
    }

    if (packs.length > 0) {
      this.logger.log(`Expired ${packs.length} credit packs`);
    }
  }

  private async expireQuotes() {
    const now = new Date();
    const result = await this.prisma.quote.updateMany({
      where: { validityDate: { lte: now }, status: { in: ['SUBMITTED', 'VIEWED'] } },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} quotes`);

      const expiredQuotes = await this.prisma.quote.findMany({
        where: { validityDate: { lte: now }, status: 'EXPIRED' },
        select: { id: true, companyId: true, rfqId: true },
      });

      for (const q of expiredQuotes) {
        await this.prisma.quoteEvent.create({
          data: {
            quoteId: q.id,
            companyId: q.companyId,
            eventType: 'QUOTE_EXPIRED' as any,
            metadata: { rfqId: q.rfqId, reason: 'auto_expiry' },
          },
        }).catch((err: any) => {
          this.logger.error(`Failed to track QUOTE_EXPIRED for ${q.id}: ${err.message}`);
        });
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<RfqJobData>, error: Error) {
    this.logger.error(`RFQ job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<RfqJobData>) {
    this.logger.log(`RFQ job ${job.id} completed`);
  }
}
