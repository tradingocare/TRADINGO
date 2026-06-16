import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class EscrowAnalyticsService {
  private readonly logger = new Logger(EscrowAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventIngestion: EventIngestionService,
  ) {}

  async trackEvent(companyId: string, escrowId: string | undefined, eventType: string, metadata?: Record<string, unknown>) {
    await this.eventIngestion.track('payment_analytics_events', {
      companyId,
      paymentId: escrowId,
      eventType,
      metadata,
    });
    this.logger.log({ msg: 'EscrowAnalyticsEvent', companyId, escrowId, eventType, metadata });
  }

  async getEscrowMetrics(companyId: string) {
    const [totalEscrowHeld, releasedCount, refundedCount, disputedCount, settlementSum] = await Promise.all([
      this.prisma.escrow.count({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'HELD' },
      }),
      this.prisma.escrow.count({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'RELEASED' },
      }),
      this.prisma.escrow.count({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'REFUNDED' },
      }),
      this.prisma.escrow.count({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'DISPUTED' },
      }),
      this.prisma.settlement.aggregate({
        where: { escrow: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] } },
        _sum: { amount: true },
      }),
    ]);

    const totalEscrows = totalEscrowHeld + releasedCount + refundedCount + disputedCount;
    const releasedAmount = Number(settlementSum._sum.amount ?? 0);
    const refundRate = totalEscrows > 0 ? (refundedCount / totalEscrows) * 100 : 0;
    const disputeRate = totalEscrows > 0 ? (disputedCount / totalEscrows) * 100 : 0;
    const settlementSuccessRate = totalEscrows > 0 ? (releasedCount / totalEscrows) * 100 : 0;

    const pendingSettlement = await this.prisma.settlement.count({
      where: { escrow: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] }, status: { in: ['PENDING', 'PROCESSING'] as any } },
    });

    return {
      totalEscrowHeld,
      releasedAmount,
      pendingSettlement,
      avgSettlementTime: 0,
      refundRate: Math.round(refundRate * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      settlementSuccessRate: Math.round(settlementSuccessRate * 100) / 100,
    };
  }
}
