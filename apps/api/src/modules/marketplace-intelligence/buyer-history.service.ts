import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface BuyerHistoryEntry {
  id: string;
  buyerId: string;
  sellerId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  eventType: string;
  query?: string | null;
  createdAt: Date;
}

@Injectable()
export class BuyerHistoryService {
  private readonly logger = new Logger(BuyerHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: Record<string, unknown>): Promise<void> {
    await this.prisma.buyerHistory.create({ data: params as any });
  }

  async getBuyerHistory(
    buyerId: string,
    options?: { eventType?: string; limit?: number; offset?: number },
  ): Promise<{ data: BuyerHistoryEntry[]; total: number }> {
    const where: Record<string, unknown> = { buyerId };
    if (options?.eventType) where['eventType'] = options.eventType;

    const [data, total] = await Promise.all([
      this.prisma.buyerHistory.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.buyerHistory.count({ where: where as any }),
    ]);

    return { data, total };
  }

  async getRelationshipScore(buyerId: string, sellerId: string): Promise<number> {
    const events = await this.prisma.buyerHistory.count({
      where: { buyerId, sellerId },
    });
    if (events === 0) return 0;

    const orders = await this.prisma.buyerHistory.count({
      where: { buyerId, sellerId, eventType: { in: ['ORDER_COMPLETED', 'ORDER_PLACED'] } },
    });

    const repeatOrders = await this.prisma.buyerHistory.count({
      where: { buyerId, sellerId, eventType: 'ORDER_COMPLETED' },
    });

    const ratings = await this.prisma.buyerHistory.findMany({
      where: { buyerId, sellerId, rating: { not: null } },
      select: { rating: true },
    });
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratings.length
      : 0;

    const negotiations = await this.prisma.buyerHistory.count({
      where: { buyerId, sellerId, eventType: 'NEGOTIATION_COMPLETED' },
    });

    const score =
      Math.min(events * 5, 30) +
      Math.min(orders * 10, 25) +
      Math.min(repeatOrders * 15, 20) +
      (avgRating / 5) * 15 +
      Math.min(negotiations * 5, 10);

    return Math.round(Math.min(score, 100));
  }

  async getCategoryPreferences(buyerId: string): Promise<Array<{ categoryId: string; score: number }>> {
    const events = await this.prisma.buyerHistory.findMany({
      where: { buyerId, categoryId: { not: null } },
      select: { categoryId: true, eventType: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const categoryScores = new Map<string, number>();
    for (const event of events) {
      if (!event.categoryId) continue;
      const current = categoryScores.get(event.categoryId) ?? 0;
      const weight = event.eventType === 'ORDER_COMPLETED' ? 10
        : event.eventType === 'ORDER_PLACED' ? 8
        : event.eventType === 'RFQ_CREATED' ? 6
        : event.eventType === 'PRODUCT_VIEW' ? 3
        : 1;
      categoryScores.set(event.categoryId, current + weight);
    }

    return [...categoryScores.entries()]
      .map(([categoryId, score]) => ({ categoryId, score: Math.min(score, 100) }))
      .sort((a, b) => b.score - a.score);
  }
}
