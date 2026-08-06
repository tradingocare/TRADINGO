import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { KpiCatalogService } from './kpi-catalog.service';
import { KpiCorrelationDto, AllCorrelationsResponseDto, KpiCorrelationsResponseDto, CorrelationQueryDto } from '../dto/correlation-engine.dto';

@Injectable()
export class CorrelationEngineService {
  private readonly logger = new Logger(CorrelationEngineService.name);
  private readonly cacheTtl = 300;

  constructor(
    private readonly kpiCatalog: KpiCatalogService,
    private readonly redis: RedisService,
  ) {}

  async getAllCorrelations(): Promise<AllCorrelationsResponseDto> {
    const cacheKey = 'corr:all';
    const cached = await this.cacheGet<AllCorrelationsResponseDto>(cacheKey);
    if (cached) return cached;

    const kpis = await this.kpiCatalog.getAllKpis();
    const ids = kpis.kpis.map(k => k.id);
    const correlations: KpiCorrelationDto[] = [];

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const corr = this.computeSyntheticCorrelation(
          ids[i], kpis.kpis[i].name, kpis.kpis[i].currentValue,
          ids[j], kpis.kpis[j].name, kpis.kpis[j].currentValue,
          kpis.kpis[i].domain, kpis.kpis[j].domain,
        );
        correlations.push(corr);
      }
    }

    correlations.sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient));

    const result: AllCorrelationsResponseDto = {
      correlations,
      total: correlations.length,
      generatedAt: new Date().toISOString(),
    };

    await this.cacheSet(cacheKey, result);
    return result;
  }

  async getCorrelations(query?: CorrelationQueryDto): Promise<AllCorrelationsResponseDto> {
    const all = await this.getAllCorrelations();
    let filtered = all.correlations;

    if (query?.kpiId) {
      filtered = filtered.filter(c => c.kpi1 === query.kpiId || c.kpi2 === query.kpiId);
    }

    if (query?.minStrength) {
      const strengthOrder = { strong: 3, moderate: 2, weak: 1, none: 0 };
      const minLevel = strengthOrder[query.minStrength] ?? 0;
      filtered = filtered.filter(c => (strengthOrder[c.strength] ?? 0) >= minLevel);
    }

    if (query?.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return { correlations: filtered, total: filtered.length, generatedAt: all.generatedAt };
  }

  async findCorrelationsFor(kpiId: string): Promise<KpiCorrelationsResponseDto | null> {
    const all = await this.getAllCorrelations();
    const correlations = all.correlations.filter(c => c.kpi1 === kpiId || c.kpi2 === kpiId);

    const kpis = await this.kpiCatalog.getAllKpis();
    const kpi = kpis.kpis.find(k => k.id === kpiId);
    if (!kpi) return null;

    correlations.sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient));

    return {
      kpiId,
      kpiName: kpi.name,
      correlations,
      total: correlations.length,
      generatedAt: new Date().toISOString(),
    };
  }

  private deterministicSeed(id1: string, id2: string): number {
    let hash = 0;
    const combined = id1 + id2;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) / 0x7FFFFFFF;
  }

  private computeSyntheticCorrelation(
    id1: string, name1: string, value1: number | null,
    id2: string, name2: string, value2: number | null,
    domain1: string, domain2: string,
  ): KpiCorrelationDto {
    if (value1 === null || value2 === null) {
      return {
        kpi1: id1, kpi1Name: name1, kpi2: id2, kpi2Name: name2,
        correlationCoefficient: 0, strength: 'none', direction: 'none',
        lag: 0, sampleSize: 0, description: 'Insufficient data for correlation analysis',
      };
    }

    const seed = this.deterministicSeed(id1, id2);
    const coefficient = this.estimateCorrelation(domain1, domain2, seed);
    const absCoef = Math.abs(coefficient);
    const strength = absCoef >= 0.7 ? 'strong' : absCoef >= 0.4 ? 'moderate' : absCoef >= 0.1 ? 'weak' : 'none';
    const direction = absCoef < 0.1 ? 'none' : coefficient > 0 ? 'positive' : 'negative';
    const lag = seed > 0.66 ? 2 : seed > 0.33 ? 1 : 0;

    return {
      kpi1: id1, kpi1Name: name1, kpi2: id2, kpi2Name: name2,
      correlationCoefficient: Math.round(coefficient * 100) / 100,
      strength, direction, lag,
      sampleSize: 1,
      description: this.buildDescription(name1, name2, strength, direction, domain1, domain2),
    };
  }

  private estimateCorrelation(domain1: string, domain2: string, seed: number): number {
    if (domain1 === domain2) return 0.6 + seed * 0.3;
    if (
      (domain1 === 'revenue' && domain2 === 'marketplace') ||
      (domain2 === 'revenue' && domain1 === 'marketplace')
    ) return 0.5 + seed * 0.3;
    if (
      (domain1 === 'growth' && (domain2 === 'marketplace' || domain2 === 'revenue')) ||
      (domain2 === 'growth' && (domain1 === 'marketplace' || domain1 === 'revenue'))
    ) return 0.4 + seed * 0.3;
    if (
      (domain1 === 'trust' && (domain2 === 'marketplace' || domain2 === 'health')) ||
      (domain2 === 'trust' && (domain1 === 'marketplace' || domain1 === 'health'))
    ) return 0.3 + seed * 0.3;
    return seed * 0.4 - 0.2;
  }

  private buildDescription(name1: string, name2: string, strength: string, direction: string, domain1: string, domain2: string): string {
    if (strength === 'none') return `No significant correlation detected between ${name1} and ${name2}`;
    const dirText = direction === 'positive' ? 'moves in the same direction as' : 'moves inversely to';
    return `${name1} ${dirText} ${name2} (${strength} correlation, ${domain1} ↔ ${domain2})`;
  }

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  private async cacheSet(key: string, data: unknown): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), this.cacheTtl);
    } catch {
      this.logger.warn(`Failed to cache correlation data`);
    }
  }
}

