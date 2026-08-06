import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface TrackSearchEvent {
  query: string;
  entityType: string;
  resultCount: number;
  companyId?: string;
  userId?: string;
  filters?: Record<string, unknown>;
  suggestions?: string[];
  latencyMs?: number;
}

@Injectable()
export class EnterpriseSearchAnalyticsService {
  private readonly logger = new Logger(EnterpriseSearchAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackSearch(event: TrackSearchEvent): Promise<void> {
    try {
      await this.prisma.enterpriseSearchAnalytics.create({
        data: {
          query: event.query,
          entityType: event.entityType,
          resultCount: event.resultCount,
          zeroResults: event.resultCount === 0,
          companyId: event.companyId || null,
          userId: event.userId || null,
          filters: event.filters ? JSON.parse(JSON.stringify(event.filters)) : undefined,
          suggestions: event.suggestions || [],
          latencyMs: event.latencyMs || 0,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to track search: ${(err as Error).message}`);
    }
  }

  async trackTrending(query: string, entityType: string = 'all'): Promise<void> {
    const now = new Date();
    const dailyKey = now.toISOString().slice(0, 10);
    const weeklyKey = this.getWeekKey(now);
    const monthlyKey = now.toISOString().slice(0, 7);

    for (const [period, periodKey] of [['daily', dailyKey], ['weekly', weeklyKey], ['monthly', monthlyKey]] as const) {
      try {
        await this.prisma.enterpriseSearchTrending.upsert({
          where: { query_entityType_period_periodKey: { query, entityType, period, periodKey } },
          update: { count: { increment: 1 } },
          create: { query, entityType, period, periodKey, count: 1 },
        });
      } catch { /* silent - eventual consistency */ }
    }
  }

  async getTopQueries(entityType?: string, days: number = 30, limit: number = 20) {
    const where: any = {
      createdAt: { gte: new Date(Date.now() - days * 86400000) },
    };
    if (entityType) where.entityType = entityType;

    return this.prisma.enterpriseSearchAnalytics.groupBy({
      by: ['query'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    }).then(r => r.map(x => ({ query: x.query, count: x._count.id })));
  }

  async getZeroResultQueries(entityType?: string, days: number = 30, limit: number = 20) {
    const where: any = {
      zeroResults: true,
      createdAt: { gte: new Date(Date.now() - days * 86400000) },
    };
    if (entityType) where.entityType = entityType;

    return this.prisma.enterpriseSearchAnalytics.groupBy({
      by: ['query'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    }).then(r => r.map(x => ({ query: x.query, count: x._count.id })));
  }

  async getPopularBrands(days: number = 30, limit: number = 10) {
    return this.getTopQueriesByEntity('brand', days, limit);
  }

  async getPopularCategories(days: number = 30, limit: number = 10) {
    return this.getTopQueriesByEntity('category', days, limit);
  }

  async getPopularAttributes(days: number = 30, limit: number = 10) {
    return this.getTopQueriesByEntity('attribute', days, limit);
  }

  async getSearchAnalyticsSummary(days: number = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const [totalSearches, uniqueQueries, zeroResultSearches, entityBreakdown] = await Promise.all([
      this.prisma.enterpriseSearchAnalytics.count({ where: { createdAt: { gte: since } } }),
      this.prisma.enterpriseSearchAnalytics.groupBy({ by: ['query'], where: { createdAt: { gte: since } }, _count: true }),
      this.prisma.enterpriseSearchAnalytics.count({ where: { zeroResults: true, createdAt: { gte: since } } }),
      this.prisma.enterpriseSearchAnalytics.groupBy({
        by: ['entityType'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const topQueries = await this.getTopQueries(undefined, days, 10);
    const zeroResultQueries = await this.getZeroResultQueries(undefined, days, 10);

    return {
      totalSearches,
      uniqueQueries: uniqueQueries.length,
      zeroResultSearches,
      zeroResultRate: totalSearches > 0 ? Math.round((zeroResultSearches / totalSearches) * 100) : 0,
      entityBreakdown: entityBreakdown.map(e => ({ entityType: e.entityType, count: e._count.id })),
      topQueries,
      zeroResultQueries,
    };
  }

  private async getTopQueriesByEntity(entityType: string, days: number, limit: number) {
    return this.getTopQueries(entityType, days, limit);
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
}
