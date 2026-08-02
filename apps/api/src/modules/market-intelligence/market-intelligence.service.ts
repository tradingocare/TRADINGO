import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface MarketTrend {
  categoryId: string;
  categoryName: string;
  totalRfqs: number;
  totalOrders: number;
  avgOrderValue: number;
  topSuppliers: number;
  demandTrend: 'RISING' | 'STABLE' | 'DECLINING';
  priceRange: { min: number; max: number };
}

export interface DemandSignal {
  productName: string;
  categoryId: string;
  rfqCount: number;
  searchCount: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  emerging: boolean;
}

const TREND_WINDOWS = [30, 60];

@Injectable()
export class MarketIntelligenceService {
  private readonly logger = new Logger(MarketIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMarketTrends(params: { period?: string; limit?: number }): Promise<MarketTrend[]> {
    const days = params.period === 'quarterly' ? 90 : 30;
    const since = new Date(Date.now() - days * 86400000);

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      take: params.limit ?? 20,
    });

    const trends: MarketTrend[] = [];

    for (const cat of categories) {
      const [rfqCount, orderCount, productAvg, supplierCount] = await Promise.all([
        this.prisma.rfq.count({
          where: { categoryId: cat.id, createdAt: { gte: since } },
        }),
        this.prisma.order.count({
          where: {
            rfq: { categoryId: cat.id },
            createdAt: { gte: since },
          },
        }),
        this.prisma.product.aggregate({
          where: { categoryId: cat.id, status: 'ACTIVE', deletedAt: null },
          _avg: { originalPrice: true },
        }),
        this.prisma.companyCategory.count({
          where: { categoryId: cat.id },
        }),
      ]);

      const earlierSince = new Date(Date.now() - TREND_WINDOWS[1] * 86400000);
      const prevRfqCount = await this.prisma.rfq.count({
        where: { categoryId: cat.id, createdAt: { gte: earlierSince, lt: since } },
      });

      let demandTrend: 'RISING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (prevRfqCount > 0) {
        const growth = (rfqCount - prevRfqCount) / prevRfqCount;
        demandTrend = growth > 0.2 ? 'RISING' : growth < -0.2 ? 'DECLINING' : 'STABLE';
      }

      const products = await this.prisma.product.findMany({
        where: { categoryId: cat.id, status: 'ACTIVE', deletedAt: null },
        select: { originalPrice: true },
        take: 100,
      });
      const prices = products.map((p) => p.originalPrice?.toNumber()).filter((p): p is number => p != null);
      const priceRange = prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };

      trends.push({
        categoryId: cat.id,
        categoryName: cat.name,
        totalRfqs: rfqCount,
        totalOrders: orderCount,
        avgOrderValue: productAvg._avg.originalPrice?.toNumber() ?? 0,
        topSuppliers: supplierCount,
        demandTrend,
        priceRange,
      });
    }

    return trends.sort((a, b) => b.totalRfqs - a.totalRfqs);
  }

  async getDemandSignals(params: { categoryId?: string; limit?: number }): Promise<DemandSignal[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const rfqs = await this.prisma.rfq.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      select: { id: true, title: true, categoryId: true },
      take: 200,
    });

    const rfqProductNames = rfqs
      .filter((r) => r.title)
      .reduce((acc, r) => {
        acc.set(r.title, (acc.get(r.title) ?? 0) + 1);
        return acc;
      }, new Map<string, number>());

    const signals: DemandSignal[] = [...rfqProductNames.entries()]
      .map(([name, count]) => {
        const urgency: 'HIGH' | 'MEDIUM' | 'LOW' = count >= 10 ? 'HIGH' : count >= 5 ? 'MEDIUM' : 'LOW';
        return {
          productName: name,
          categoryId: params.categoryId ?? '',
          rfqCount: count,
          searchCount: Math.round(count * 3),
          urgency,
          emerging: count >= 3,
        };
      })
      .sort((a, b) => b.rfqCount - a.rfqCount)
      .slice(0, params.limit ?? 20);

    return signals;
  }
}
