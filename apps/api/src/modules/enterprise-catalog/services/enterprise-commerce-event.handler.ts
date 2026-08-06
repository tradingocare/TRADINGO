import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CatalogRewardsService } from '../../gocash-integration/catalog-rewards.service';
import { CatalogAnalyticsService } from '../../ai/catalog-analytics.service';
import { CatalogAdvertisingService } from '../../advertising/catalog-advertising.service';
import { NotificationService } from '../../notification/notification.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductLifecycleEvent, QualityUpdatedEvent } from './enterprise-commerce-event.service';

@Injectable()
export class EnterpriseCommerceEventHandler {
  private readonly logger = new Logger(EnterpriseCommerceEventHandler.name);

  constructor(
    private readonly rewards: CatalogRewardsService,
    private readonly analytics: CatalogAnalyticsService,
    private readonly advertising: CatalogAdvertisingService,
    private readonly notification: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('product.created')
  async handleProductCreated(event: ProductLifecycleEvent) {
    const { productId, companyId, userId } = event;
    try {
      await this.rewards.rewardProductCreated(companyId, productId);
      await this.analytics.trackAiUsage(companyId, userId, 'PRODUCT_CREATED', { productId });
    } catch (err: any) {
      this.logger.warn(`product.created handler error: ${err.message}`);
    }
  }

  @OnEvent('product.published')
  async handleProductPublished(event: ProductLifecycleEvent) {
    const { productId, companyId, userId } = event;
    try {
      const isFirstPublish = await this.isFirstPublished(companyId, productId);
      if (isFirstPublish) {
        await this.rewards.rewardFirstPublish(companyId, productId);
      } else {
        await this.rewards.rewardProductPublished(companyId, productId);
      }
      await this.analytics.trackAiUsage(companyId, userId, 'PRODUCT_PUBLISHED', { productId, isFirstPublish });
    } catch (err: any) {
      this.logger.warn(`product.published handler error: ${err.message}`);
    }
  }

  @OnEvent('product.quality.updated')
  async handleQualityUpdated(event: QualityUpdatedEvent) {
    const { productId, companyId, userId, oldScore, newScore } = event;
    try {
      await this.analytics.trackQualityChange(companyId, userId, productId, oldScore, newScore);

      if (newScore >= 90 && oldScore < 90) {
        await this.rewards.rewardQuality90(companyId, productId);
        await this.notifySeller(companyId, userId, 'quality_milestone', {
          productId, score: newScore, milestone: '90',
          message: `Product quality score reached ${newScore}/100! You earned 150 GOCASH.`,
        });
      } else if (newScore >= 70 && oldScore < 70) {
        await this.rewards.rewardQuality70(companyId, productId);
        await this.notifySeller(companyId, userId, 'quality_milestone', {
          productId, score: newScore, milestone: '70',
          message: `Product quality score reached ${newScore}/100! You earned 75 GOCASH.`,
        });
      }

      if (newScore >= 60 && oldScore < 60) {
        await this.advertising.autoPromoteTopProducts(companyId);
        await this.notifySeller(companyId, userId, 'advertising_opportunity', {
          productId, score: newScore,
          message: `Product quality is excellent! A promotion has been created automatically.`,
        });
      }

      if (newScore < oldScore) {
        await this.notifySeller(companyId, userId, 'quality_dropped', {
          productId, oldScore, newScore,
          message: `Product quality score dropped from ${oldScore} to ${newScore}. Check recommendations to improve.`,
        });
      }
    } catch (err: any) {
      this.logger.warn(`product.quality.updated handler error: ${err.message}`);
    }
  }

  @OnEvent('product.ai.enriched')
  async handleAiEnriched(event: ProductLifecycleEvent) {
    const { productId, companyId, userId, metadata } = event;
    try {
      await this.rewards.rewardAiUsed(companyId, productId);
      await this.analytics.trackAiUsage(companyId, userId, 'AI_ENRICHED', { productId, action: metadata?.action || 'unknown' });
    } catch (err: any) {
      this.logger.warn(`product.ai.enriched handler error: ${err.message}`);
    }
  }

  private async notifySeller(companyId: string, userId: string, type: string, context: Record<string, unknown>) {
    try {
      await this.notification.createWithTemplate(
        companyId,
        userId,
        'GENERIC' as any,
        { message: context.message || 'Product update' },
      );
    } catch (err: any) {
      this.logger.warn(`Notification failed: ${err.message}`);
    }
  }

  private async isFirstPublished(companyId: string, excludeProductId: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { companyId, status: 'ACTIVE' as any, id: { not: excludeProductId }, deletedAt: null },
    });
    return count === 0;
  }
}