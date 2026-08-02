import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CatalogEventType = 'AI_USAGE' | 'QUALITY_CHANGE' | 'DUPLICATE_DETECTED' | 'MISSING_FIELDS_RESOLVED' | 'BULK_ACTION' | 'PRODUCT_CREATED' | 'PRODUCT_PUBLISHED' | 'REWARD_EARNED' | 'ADVERTISING_CREATED' | 'SEARCH_IMPRESSION' | 'SEARCH_CLICK' | 'CONVERSION';

@Injectable()
export class CatalogAnalyticsService {
  private readonly logger = new Logger(CatalogAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackAiUsage(companyId: string, userId: string | undefined, action: string, metadata?: Record<string, any>) {
    return this.logEvent(companyId, userId, 'AI_USAGE', { action, ...metadata });
  }

  async trackQualityChange(companyId: string, userId: string | undefined, productId: string, oldScore: number, newScore: number) {
    return this.logEvent(companyId, userId, 'QUALITY_CHANGE', { productId, oldScore, newScore, delta: newScore - oldScore });
  }

  async trackDuplicateDetection(companyId: string, userId: string | undefined, productId: string, duplicatesFound: number) {
    return this.logEvent(companyId, userId, 'DUPLICATE_DETECTED', { productId, duplicatesFound });
  }

  async trackMissingFieldsResolved(companyId: string, userId: string | undefined, productId: string, resolvedFields: string[]) {
    return this.logEvent(companyId, userId, 'MISSING_FIELDS_RESOLVED', { productId, resolvedFields });
  }

  async trackBulkAction(companyId: string, userId: string | undefined, action: string, productCount: number) {
    return this.logEvent(companyId, userId, 'BULK_ACTION', { action, productCount });
  }

  async trackProductCreated(companyId: string, userId: string | undefined, productId: string, metadata?: Record<string, any>) {
    return this.logEvent(companyId, userId, 'PRODUCT_CREATED', { productId, ...metadata });
  }

  async trackProductPublished(companyId: string, userId: string | undefined, productId: string, isFirstPublish: boolean) {
    return this.logEvent(companyId, userId, 'PRODUCT_PUBLISHED', { productId, isFirstPublish });
  }

  async trackRewardEarned(companyId: string, userId: string | undefined, rewardAction: string, amount: number, metadata?: Record<string, any>) {
    return this.logEvent(companyId, userId, 'REWARD_EARNED', { rewardAction, amount, ...metadata });
  }

  async trackAdvertisingCreated(companyId: string, userId: string | undefined, productId: string, adType: string) {
    return this.logEvent(companyId, userId, 'ADVERTISING_CREATED', { productId, adType });
  }

  async getQualityTrend(companyId: string, days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    const events = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { companyId, eventType: 'PRODUCT_VIEW' as any, createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadata: true },
      take: 1000,
    });

    const dailyMap = new Map<string, { deltas: number[]; count: number }>();
    for (const e of events) {
      const meta = e.metadata as Record<string, any> | null;
      if (meta?.catalogEventType === 'QUALITY_CHANGE') {
        const day = e.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(day) || { deltas: [], count: 0 };
        existing.deltas.push(meta.delta || 0);
        existing.count += 1;
        dailyMap.set(day, existing);
      }
    }

    return [...dailyMap.entries()].map(([date, v]) => ({
      date,
      avgDelta: v.deltas.length > 0 ? Math.round(v.deltas.reduce((a, b) => a + b, 0) / v.deltas.length) : 0,
      eventCount: v.count,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async logEvent(companyId: string, userId: string | undefined, catalogEventType: string, metadata: Record<string, any>) {
    return this.prisma.sellerAnalyticsEvent.create({
      data: {
        companyId,
        userId: userId || null,
        eventType: 'PRODUCT_VIEW' as any,
        metadata: { catalogEventType, ...metadata },
      },
    }).catch(err => this.logger.warn(`Failed to track ${catalogEventType}: ${err.message}`));
  }
}