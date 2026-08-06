import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { gracefulCatch } from '../../../common/utils/graceful-catch';
import { FounderAiAggregatorService } from '../../founder-ai/founder-ai.service';
import { EnterpriseIntelligenceService } from '../../enterprise-intelligence/enterprise-intelligence.service';
import {
  ConsolidatedHealthResponseDto, ConsolidatedHealthDimension,
  HealthSourceBreakdown, ConsolidatedHealthQueryDto,
} from '../dto/unified-health.dto';

@Injectable()
export class HealthIndexConsolidationService {
  private readonly logger = new Logger(HealthIndexConsolidationService.name);
  private readonly cacheTtl = 60;

  constructor(
    private readonly founderAi: FounderAiAggregatorService,
    private readonly enterprise: EnterpriseIntelligenceService,
    private readonly redis: RedisService,
  ) {}

  async getConsolidatedHealth(query?: ConsolidatedHealthQueryDto): Promise<ConsolidatedHealthResponseDto> {
    const cacheKey = `health:consolidated:${JSON.stringify(query ?? {})}`;
    const cached = await this.cacheGet<ConsolidatedHealthResponseDto>(cacheKey);
    if (cached) return cached;

    const [founderHealthResult, entHealthIndex] = await Promise.all([
      this.founderAi.healthScore().catch(gracefulCatch('healthConsolidation.getConsolidated.founderHealth', null)),
      this.enterprise.getHealthIndex().catch(gracefulCatch('healthConsolidation.getConsolidated.enterpriseHealth', null)),
    ]);

    const founderHealth = founderHealthResult?.data ?? null;

    const weights = {
      founderAi: query?.founderAiWeight ?? 0.40,
      enterprise: query?.enterpriseWeight ?? 0.35,
      marketplace: query?.marketplaceWeight ?? 0.25,
    };

    const totalWeight = weights.founderAi + weights.enterprise + weights.marketplace;
    if (totalWeight > 0) {
      weights.founderAi /= totalWeight;
      weights.enterprise /= totalWeight;
      weights.marketplace /= totalWeight;
    }

    const founderScore = founderHealth?.overallScore ?? null;
    const enterpriseScore = entHealthIndex?.overall ?? null;
    const marketplaceScore = this.extractMarketplaceHealth(entHealthIndex, founderHealth);

    const consolidatedScore = this.computeConsolidatedScore(founderScore, enterpriseScore, marketplaceScore, weights);
    const grade = this.computeGrade(consolidatedScore);
    const status: 'healthy' | 'degraded' | 'critical' = consolidatedScore >= 60 ? 'healthy' : consolidatedScore >= 30 ? 'degraded' : 'critical';

    const dimensions = this.buildDimensions(founderHealth, entHealthIndex, marketplaceScore);
    const sources = this.buildSources(founderHealth, entHealthIndex, founderScore, enterpriseScore);
    const recommendations = this.buildRecommendations(consolidatedScore, dimensions, founderScore, enterpriseScore);

    const result: ConsolidatedHealthResponseDto = {
      status,
      overallScore: consolidatedScore,
      grade,
      dimensions,
      sources,
      weights,
      period: '30d',
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheSet(cacheKey, result);
    return result;
  }

  private extractMarketplaceHealth(entHealth: any, founderHealth: any): number | null {
    if (entHealth?.dimensions) {
      const mktDim = entHealth.dimensions.find((d: any) => d.name?.toLowerCase().includes('marketplace'));
      if (mktDim?.score !== undefined) return Math.round(mktDim.score);
    }
    if (founderHealth?.marketplaceHealth?.score !== undefined) {
      return Math.round(founderHealth.marketplaceHealth.score);
    }
    return null;
  }

  private computeConsolidatedScore(
    founderScore: number | null,
    enterpriseScore: number | null,
    marketplaceScore: number | null,
    weights: { founderAi: number; enterprise: number; marketplace: number },
  ): number {
    let weightedSum = 0;
    let effectiveWeight = 0;

    if (founderScore !== null) {
      weightedSum += founderScore * weights.founderAi;
      effectiveWeight += weights.founderAi;
    }
    if (enterpriseScore !== null) {
      weightedSum += enterpriseScore * weights.enterprise;
      effectiveWeight += weights.enterprise;
    }
    if (marketplaceScore !== null) {
      weightedSum += marketplaceScore * weights.marketplace;
      effectiveWeight += weights.marketplace;
    }

    if (effectiveWeight === 0) return 50;
    return Math.round(weightedSum / effectiveWeight);
  }

  private buildDimensions(
    founderHealth: any,
    entHealthIndex: any,
    marketplaceScore: number | null,
  ): ConsolidatedHealthDimension[] {
    const dims: ConsolidatedHealthDimension[] = [];
    const allDimNames = ['Revenue', 'Growth', 'Trust', 'Marketplace Health', 'Retention', 'Ecosystem', 'System Stability'];

    for (const name of allDimNames) {
      const founderDim = founderHealth ? this.findFounderDim(founderHealth, name) : null;
      const entDim = entHealthIndex?.dimensions?.find((d: any) =>
        d.name?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(d.name?.toLowerCase() ?? ''),
      ) ?? null;

      let consolidatedScore = 0;
      let count = 0;
      if (founderDim !== null) { consolidatedScore += founderDim.score; count++; }
      if (entDim !== null) { consolidatedScore += Math.round(entDim.score); count++; }
      if (name === 'Marketplace Health' && marketplaceScore !== null) {
        consolidatedScore += marketplaceScore;
        count++;
      }

      const finalScore = count > 0 ? Math.round(consolidatedScore / count) : 50;
      dims.push({
        name,
        founderAiScore: founderDim?.score ?? null,
        enterpriseScore: entDim?.score !== null ? Math.round(entDim.score) : null,
        consolidatedScore: finalScore,
        weight: Math.round((1 / allDimNames.length) * 100) / 100,
        status: finalScore >= 70 ? 'healthy' : finalScore >= 40 ? 'monitor' : 'critical',
      });
    }

    return dims;
  }

  private findFounderDim(founderHealth: any, name: string): { score: number } | null {
    const keyMap: Record<string, string> = {
      'Revenue': 'revenue',
      'Growth': 'growth',
      'Trust': 'trust',
      'Marketplace Health': 'marketplaceHealth',
      'Retention': 'retention',
      'Ecosystem': 'ecosystemReadiness',
      'System Stability': 'collections',
    };
    const key = keyMap[name];
    if (!key) return null;
    const dim = founderHealth[key];
    return dim ? { score: dim.score } : null;
  }

  private buildSources(
    founderHealth: any,
    entHealthIndex: any,
    founderScore: number | null,
    enterpriseScore: number | null,
  ): HealthSourceBreakdown[] {
    const sources: HealthSourceBreakdown[] = [];

    if (founderScore !== null) {
      const founderDims: { name: string; score: number }[] = [];
      for (const key of ['revenue', 'growth', 'retention', 'trust', 'collections', 'marketplaceHealth', 'ecosystemReadiness']) {
        const d = founderHealth?.[key];
        if (d) founderDims.push({ name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), score: Math.round(d.score) });
      }
      sources.push({
        source: 'Founder AI (7-dimension)',
        overallScore: founderScore,
        grade: this.computeGrade(founderScore),
        dimensions: founderDims,
      });
    }

    if (enterpriseScore !== null) {
      const entDims: { name: string; score: number }[] = (entHealthIndex?.dimensions ?? []).map((d: any) => ({
        name: d.name,
        score: Math.round(d.score),
      }));
      sources.push({
        source: 'Enterprise Intelligence (7-dimension)',
        overallScore: enterpriseScore,
        grade: entHealthIndex?.grade ?? this.computeGrade(enterpriseScore),
        dimensions: entDims,
      });
    }

    return sources;
  }

  private buildRecommendations(
    consolidatedScore: number,
    dimensions: ConsolidatedHealthDimension[],
    founderScore: number | null,
    enterpriseScore: number | null,
  ): string[] {
    const recommendations: string[] = [];

    if (consolidatedScore < 30) {
      recommendations.push('CRITICAL: Platform health is severely degraded. Immediate intervention required.');
    } else if (consolidatedScore < 50) {
      recommendations.push('WARNING: Platform health is below acceptable threshold. Review all dimensions.');
    }

    for (const dim of dimensions) {
      if (dim.status === 'critical') {
        recommendations.push(`Address critical ${dim.name} dimension (score: ${dim.consolidatedScore}/100).`);
      } else if (dim.status === 'monitor') {
        recommendations.push(`Monitor ${dim.name} dimension (score: ${dim.consolidatedScore}/100).`);
      }
    }

    if (founderScore !== null && enterpriseScore !== null) {
      const diff = Math.abs(founderScore - enterpriseScore);
      if (diff > 20) {
        recommendations.push(`Health score discrepancy (${diff} points) between Founder AI (${founderScore}) and Enterprise Intelligence (${enterpriseScore}). Review scoring methodologies.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Platform health is stable across all dimensions. Continue monitoring.');
    }

    return recommendations;
  }

  private computeGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { this.logger.warn('Failed to parse cache JSON in healthConsolidation.cacheGet'); return null; }
  }

  private async cacheSet(key: string, data: unknown): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), this.cacheTtl);
    } catch {
      this.logger.warn({ key }, 'Failed to cache health index data');
    }
  }
}

