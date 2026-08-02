import { Injectable, Logger } from '@nestjs/common';
import { FounderAiAggregatorService } from '../founder-ai/founder-ai.service';
import { EnterpriseIntelligenceService } from '../enterprise-intelligence/enterprise-intelligence.service';
import { FinanceAggregatorService } from '../finance/aggregator.service';
import { GrowthIntelligenceService } from '../growth-intelligence/growth-intelligence.service';
import { RedisService } from '../../common/services/redis.service';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import { UnifiedFounderDashboardResponse, FounderHealthResponse, HealthDimension, HealthQueryDto } from './dto/executive-intelligence.dto';

@Injectable()
export class ExecutiveIntelligenceFacadeService {
  private readonly logger = new Logger(ExecutiveIntelligenceFacadeService.name);
  private readonly cacheTtl = 60;

  constructor(
    private readonly founderAi: FounderAiAggregatorService,
    private readonly enterprise: EnterpriseIntelligenceService,
    private readonly finance: FinanceAggregatorService,
    private readonly growth: GrowthIntelligenceService,
    private readonly redis: RedisService,
  ) {}

  private async cacheGet<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { this.logger.warn('Failed to parse cache JSON in getUnifiedDashboard.cacheGet'); return null; }
  }

  private async cacheSet(key: string, data: unknown, ttl?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(data), ttl ?? this.cacheTtl);
  }

  async getUnifiedDashboard(): Promise<UnifiedFounderDashboardResponse> {
    const cacheKey = 'exec:intel:unified';
    const cached = await this.cacheGet<UnifiedFounderDashboardResponse>(cacheKey);
    if (cached) return cached;

    const [revData, cards, briefResult, healthResult, digitalTwin, healthIndex, predictions, growthSummary] = await Promise.all([
      this.finance.getAuthoritativeRevenue({ includeYesterday: true, includeGrowth: true }).catch(gracefulCatch('executiveIntel.getUnifiedDashboard.revenue', null)),
      this.finance.getDashboardCards().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.dashboardCards', null)),
      this.founderAi.morningBrief().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.morningBrief', null)),
      this.founderAi.healthScore().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.healthScore', null)),
      this.enterprise.getDigitalTwin().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.digitalTwin', null)),
      this.enterprise.getHealthIndex().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.healthIndex', null)),
      this.enterprise.getPredictions().catch(gracefulCatch('executiveIntel.getUnifiedDashboard.predictions', null)),
      this.growth.getGrowthKpis(30).catch(gracefulCatch('executiveIntel.getUnifiedDashboard.growthKpis', null)),
    ]);

    const result: UnifiedFounderDashboardResponse = {
      overview: {
        totalRevenue: revData?.total ?? 0,
        todayRevenue: revData?.today ?? 0,
        revenueGrowth: revData?.revenueGrowth30d ?? 0,
        totalOrders: digitalTwin?.marketplace?.totalOrders ?? 0,
        ordersToday: briefResult?.data?.orders?.today ?? 0,
        orderGrowth30d: growthSummary?.totalOrders ? ((growthSummary as any).orderGrowth ?? '0%').replace('%', '') : 0,
        totalUsers: digitalTwin?.marketplace?.totalBuyers ?? briefResult?.data?.signups?.total ?? 0,
        totalCompanies: digitalTwin?.marketplace?.totalSellers ?? 0,
        activeRfqs: digitalTwin?.marketplace?.totalRfqs ?? 0,
        pendingVerifications: briefResult?.data?.verificationQueue ?? 0,
        openDisputes: briefResult?.data?.disputes?.open ?? 0,
      },
      health: {
        overallScore: healthResult?.data?.overallScore ?? 0,
        grade: healthResult?.data?.grade ?? 'N/A',
        dimensions: healthResult?.data ? this.mapHealthDimensions(healthResult.data) : [],
        source: 'Founder AI (7-dimension weighted)',
      },
      finance: {
        escrowBalance: cards?.escrowBalance ?? 0,
        pendingSettlements: cards?.pendingSettlements ?? 0,
        commissionEarned: cards?.commissionEarned ?? 0,
        activeDisputes: cards?.activeDisputes ?? 0,
        failedSettlements: cards?.failedSettlements ?? 0,
      },
      enterprise: {
        digitalTwin: digitalTwin ?? {},
        healthIndex: healthIndex ?? {},
        predictions: predictions ?? {},
      },
      generatedAt: new Date().toISOString(),
    };

    await this.cacheSet(cacheKey, result);
    return result;
  }

  async getHealth(query?: HealthQueryDto): Promise<FounderHealthResponse> {
    const cacheKey = `exec:intel:health:${JSON.stringify(query ?? {})}`;
    const cached = await this.cacheGet<FounderHealthResponse>(cacheKey);
    if (cached) return cached;

    const [founderHealth, entHealthIndex] = await Promise.all([
      this.founderAi.healthScore().catch(gracefulCatch('executiveIntel.getHealth.founderHealth', null)),
      this.enterprise.getHealthIndex().catch(gracefulCatch('executiveIntel.getHealth.enterpriseHealthIndex', null)),
    ]);

    const weights = {
      revenue: query?.revenueWeight ?? 0.20,
      growth: query?.growthWeight ?? 0.15,
      retention: query?.retentionWeight ?? 0.15,
      trust: query?.trustWeight ?? 0.15,
      marketplace: query?.marketplaceWeight ?? (1 - (query?.revenueWeight ?? 0.20) - (query?.growthWeight ?? 0.15) - (query?.retentionWeight ?? 0.15) - (query?.trustWeight ?? 0.15)) / 2,
    };

    if (founderHealth?.data) {
      const dims: HealthDimension[] = [
        { name: 'Revenue', score: founderHealth.data.revenue.score, weight: weights.revenue, contribution: Math.round(founderHealth.data.revenue.score * weights.revenue), status: founderHealth.data.revenue.score >= 70 ? 'healthy' : founderHealth.data.revenue.score >= 40 ? 'monitor' : 'critical' },
        { name: 'Growth', score: founderHealth.data.growth.score, weight: weights.growth, contribution: Math.round(founderHealth.data.growth.score * weights.growth), status: founderHealth.data.growth.score >= 70 ? 'healthy' : founderHealth.data.growth.score >= 40 ? 'monitor' : 'critical' },
        { name: 'Retention', score: founderHealth.data.retention.score, weight: weights.retention, contribution: Math.round(founderHealth.data.retention.score * weights.retention), status: founderHealth.data.retention.score >= 70 ? 'healthy' : founderHealth.data.retention.score >= 40 ? 'monitor' : 'critical' },
        { name: 'Trust', score: founderHealth.data.trust.score, weight: weights.trust, contribution: Math.round(founderHealth.data.trust.score * weights.trust), status: founderHealth.data.trust.score >= 70 ? 'healthy' : founderHealth.data.trust.score >= 40 ? 'monitor' : 'critical' },
        { name: 'Marketplace Health', score: founderHealth.data.marketplaceHealth.score, weight: weights.marketplace, contribution: Math.round(founderHealth.data.marketplaceHealth.score * weights.marketplace), status: founderHealth.data.marketplaceHealth.score >= 70 ? 'healthy' : founderHealth.data.marketplaceHealth.score >= 40 ? 'monitor' : 'critical' },
      ];

      const overallScore = Math.round(dims.reduce((a, d) => a + d.score * d.weight, 0));
      const grade = overallScore >= 90 ? 'A+' : overallScore >= 75 ? 'A' : overallScore >= 60 ? 'B+' : overallScore >= 45 ? 'B' : overallScore >= 30 ? 'C' : 'D';
      const status: 'healthy' | 'degraded' | 'critical' = overallScore >= 60 ? 'healthy' : overallScore >= 30 ? 'degraded' : 'critical';

      const result: FounderHealthResponse = {
        status,
        overallScore,
        grade,
        dimensions: dims,
        period: '30d',
        source: 'ExecutiveIntelligenceFacade (configurable weights)',
        generatedAt: new Date().toISOString(),
      };

      await this.cacheSet(cacheKey, result, 60);
      return result;
    }

    const fallback: FounderHealthResponse = {
      status: entHealthIndex?.overall ? (entHealthIndex.overall >= 60 ? 'healthy' : entHealthIndex.overall >= 30 ? 'degraded' : 'critical') : 'degraded',
      overallScore: entHealthIndex?.overall ?? 0,
      grade: entHealthIndex?.grade ?? 'N/A',
      dimensions: entHealthIndex?.dimensions?.map((d: any) => ({
        name: d.name,
        score: Math.round(d.score),
        weight: d.weight,
        contribution: Math.round(d.score * d.weight),
        status: d.status ?? (d.score >= 70 ? 'healthy' : d.score >= 40 ? 'monitor' : 'critical'),
        description: d.description,
      })) ?? [],
      period: '30d',
      source: 'Enterprise Intelligence (fallback)',
      generatedAt: new Date().toISOString(),
    };

    await this.cacheSet(cacheKey, fallback, 60);
    return fallback;
  }

  private mapHealthDimensions(data: any): HealthDimension[] {
    const dims: HealthDimension[] = [];
    for (const key of ['revenue', 'growth', 'retention', 'trust', 'collections', 'marketplaceHealth', 'ecosystemReadiness']) {
      const d = data[key];
      if (d) {
        dims.push({
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          score: d.score,
          weight: d.weight,
          contribution: d.contribution,
          status: d.score >= 70 ? 'healthy' : d.score >= 40 ? 'monitor' : 'critical',
        });
      }
    }
    return dims;
  }
}
