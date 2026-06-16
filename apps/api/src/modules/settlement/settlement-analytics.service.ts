import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class SettlementAnalyticsService {
  private readonly logger = new Logger(SettlementAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventIngestion: EventIngestionService,
  ) {}

  async trackEvent(companyId: string, settlementId: string | undefined, eventType: string, metadata?: Record<string, unknown>) {
    await this.eventIngestion.track('settlement_analytics_events', {
      companyId,
      settlementId,
      eventType,
      metadata,
    });
    this.logger.log({ msg: 'SettlementAnalyticsEvent', companyId, settlementId, eventType, metadata });
  }

  async getSettlementMetrics(companyId: string) {
    const [totalProcessed, totalFailed, amountResult] = await Promise.all([
      this.prisma.settlement.count({
        where: {
          escrow: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] },
          status: 'PROCESSED',
        },
      }),
      this.prisma.settlement.count({
        where: {
          escrow: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] },
          status: 'FAILED',
        },
      }),
      this.prisma.settlement.aggregate({
        where: {
          escrow: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] },
          status: 'PROCESSED',
        },
        _sum: { amount: true },
      }),
    ]);

    const total = totalProcessed + totalFailed;
    const totalAmount = Number(amountResult._sum.amount ?? 0);

    return {
      totalProcessed,
      totalAmount,
      successRate: total > 0 ? (totalProcessed / total) * 100 : 0,
      avgProcessingTime: 0,
    };
  }
}
