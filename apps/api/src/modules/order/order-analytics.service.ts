import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class OrderAnalyticsService {
  private readonly logger = new Logger(OrderAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventIngestion: EventIngestionService,
  ) {}

  async trackEvent(companyId: string, orderId: string | undefined, eventType: string, metadata?: Record<string, unknown>) {
    await this.eventIngestion.track('order_analytics_events', {
      companyId,
      orderId,
      eventType,
      metadata,
    });
    this.logger.log({ msg: 'OrderAnalyticsEvent', companyId, orderId, eventType, metadata });
  }

  async getOrderMetrics(companyId: string) {
    const [totalOrders, completedOrders, cancelledOrders, returnedOrders, revenue] = await Promise.all([
      this.prisma.order.count({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] } }),
      this.prisma.order.count({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: 'RETURNED' } }),
      this.prisma.order.aggregate({
        where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }], status: { notIn: ['CANCELLED', 'RETURNED'] } },
        _sum: { totalAmount: true },
      }),
    ]);

    const repeatOrders = await this.prisma.order.count({
      where: { buyerCompanyId: companyId, source: 'REPEAT' },
    });

    const totalRevenue = Number(revenue._sum.totalAmount ?? 0);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      returnedOrders,
      revenue: totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      repeatOrders,
      cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
      returnRate: totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0,
    };
  }
}
