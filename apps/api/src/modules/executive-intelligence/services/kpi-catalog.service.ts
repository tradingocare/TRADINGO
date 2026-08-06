import { Injectable, Logger } from '@nestjs/common';
import { FinanceAggregatorService } from '../../finance/aggregator.service';
import { FounderAiAggregatorService } from '../../founder-ai/founder-ai.service';
import { EnterpriseIntelligenceService } from '../../enterprise-intelligence/enterprise-intelligence.service';
import { GrowthIntelligenceService } from '../../growth-intelligence/growth-intelligence.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { KpiDefinition, KpiValue, KpiCatalogResponse, KpiSearchQueryDto, KpiDetailResponse } from '../dto/kpi-catalog.dto';

interface KpiRegistryEntry {
  id: string;
  name: string;
  domain: string;
  source: string;
  unit: string;
  description: string;
  fetcher: () => Promise<{ current: number | null; previous: number | null }>;
}

@Injectable()
export class KpiCatalogService {
  private readonly logger = new Logger(KpiCatalogService.name);
  private readonly registry: KpiRegistryEntry[];

  constructor(
    private readonly finance: FinanceAggregatorService,
    private readonly founderAi: FounderAiAggregatorService,
    private readonly enterprise: EnterpriseIntelligenceService,
    private readonly growth: GrowthIntelligenceService,
    private readonly analytics: AnalyticsService,
  ) {
    this.registry = this.buildRegistry();
  }

  private buildRegistry(): KpiRegistryEntry[] {
    return [
      {
        id: 'revenue.total', name: 'Total Revenue', domain: 'revenue', source: 'FinanceAggregatorService', unit: 'rupees',
        description: 'Total captured payment revenue (all time)',
        fetcher: async () => {
          const r = await this.finance.getAuthoritativeRevenue({});
          return { current: r.total, previous: null };
        },
      },
      {
        id: 'revenue.today', name: 'Today Revenue', domain: 'revenue', source: 'FinanceAggregatorService', unit: 'rupees',
        description: 'Revenue captured today',
        fetcher: async () => {
          const r = await this.finance.getAuthoritativeRevenue({ includeYesterday: true });
          return { current: r.today, previous: r.yesterday };
        },
      },
      {
        id: 'revenue.month', name: 'This Month Revenue', domain: 'revenue', source: 'FinanceAggregatorService', unit: 'rupees',
        description: 'Revenue captured this month',
        fetcher: async () => {
          const r = await this.finance.getAuthoritativeRevenue({});
          return { current: r.thisMonth, previous: r.lastMonth };
        },
      },
      {
        id: 'revenue.growth30d', name: 'Revenue Growth (30d)', domain: 'revenue', source: 'FinanceAggregatorService', unit: 'percent',
        description: 'Revenue growth rate over trailing 30 days vs previous 30 days',
        fetcher: async () => {
          const r = await this.finance.getAuthoritativeRevenue({ includeGrowth: true });
          return { current: r.revenueGrowth30d, previous: null };
        },
      },
      {
        id: 'growth.newUsers', name: 'New Users', domain: 'growth', source: 'GrowthIntelligenceService', unit: 'count',
        description: 'New users registered in the last 30 days',
        fetcher: async () => {
          const g = await this.growth.getGrowthKpis(30);
          return { current: g.newUsers, previous: null };
        },
      },
      {
        id: 'growth.orders', name: 'Total Orders (30d)', domain: 'growth', source: 'GrowthIntelligenceService', unit: 'count',
        description: 'Total orders placed in the last 30 days',
        fetcher: async () => {
          const g = await this.growth.getGrowthKpis(30);
          return { current: g.totalOrders, previous: null };
        },
      },
      {
        id: 'growth.revenue', name: 'Growth Revenue (30d)', domain: 'growth', source: 'GrowthIntelligenceService', unit: 'rupees',
        description: 'Revenue from growth in the last 30 days',
        fetcher: async () => {
          const g = await this.growth.getGrowthKpis(30);
          return { current: g.revenue, previous: null };
        },
      },
      {
        id: 'growth.userGrowth', name: 'User Growth Rate', domain: 'growth', source: 'GrowthIntelligenceService', unit: 'percent',
        description: 'Period-over-period user growth rate',
        fetcher: async () => {
          const g = await this.growth.getGrowthKpis(30);
          const v = parseFloat(String(g.userGrowth).replace('%', '').replace('+', ''));
          return { current: isNaN(v) ? null : v, previous: null };
        },
      },
      {
        id: 'marketplace.buyers', name: 'Total Buyers', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total registered buyers on the platform',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.totalBuyers ?? null, previous: null };
        },
      },
      {
        id: 'marketplace.sellers', name: 'Total Sellers', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total registered sellers on the platform',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.totalSellers ?? null, previous: null };
        },
      },
      {
        id: 'marketplace.products', name: 'Active Products', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total active products listed on the platform',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.activeProducts ?? dt.marketplace?.totalProducts ?? null, previous: null };
        },
      },
      {
        id: 'marketplace.gmv', name: 'GMV', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'rupees',
        description: 'Gross Merchandise Value',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.gmv ?? null, previous: null };
        },
      },
      {
        id: 'marketplace.rfqs', name: 'Active RFQs', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total RFQs on the platform',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.totalRfqs ?? null, previous: null };
        },
      },
      {
        id: 'marketplace.orders', name: 'Total Orders', domain: 'marketplace', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total orders placed on the platform',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.marketplace?.totalOrders ?? null, previous: null };
        },
      },
      {
        id: 'trust.averageScore', name: 'Average Trust Score', domain: 'trust', source: 'EnterpriseIntelligenceService', unit: 'score',
        description: 'Average TradTrust score across all companies',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.trust?.averageTrustScore ?? null, previous: null };
        },
      },
      {
        id: 'trust.verifiedCompanies', name: 'Verified Companies', domain: 'trust', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Number of verified companies',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.trust?.verifiedCompanies ?? null, previous: null };
        },
      },
      {
        id: 'health.founderAi', name: 'Founder AI Health Score', domain: 'health', source: 'FounderAiAggregatorService', unit: 'score',
        description: 'Overall platform health score from Founder AI (7 dimensions)',
        fetcher: async () => {
          const h = await this.founderAi.healthScore();
          return { current: h.data?.overallScore ?? null, previous: null };
        },
      },
      {
        id: 'health.enterpriseIntelligence', name: 'Enterprise Intelligence Health', domain: 'health', source: 'EnterpriseIntelligenceService', unit: 'score',
        description: 'Platform health index from Enterprise Intelligence',
        fetcher: async () => {
          const hi = await this.enterprise.getHealthIndex();
          return { current: hi.overall ?? null, previous: null };
        },
      },
      {
        id: 'growth.companyGrowth', name: 'Company Growth Rate', domain: 'growth', source: 'EnterpriseIntelligenceService', unit: 'percent',
        description: 'Period-over-period company registration growth rate',
        fetcher: async () => {
          const gv = await this.enterprise.getGrowthVelocity();
          const dim = gv.dimensions?.find((d: any) => d.name === 'Companies');
          const v = parseFloat(String(dim?.growthRate ?? '0').replace('%', ''));
          return { current: isNaN(v) ? null : v, previous: null };
        },
      },
      {
        id: 'engagement.professionals', name: 'TradeServ Professionals', domain: 'engagement', source: 'EnterpriseIntelligenceService', unit: 'count',
        description: 'Total TradeServ registered professionals',
        fetcher: async () => {
          const dt = await this.enterprise.getDigitalTwin();
          return { current: dt.tradeserv?.totalProfessionals ?? null, previous: null };
        },
      },
    ];
  }

  getDefinitions(): KpiDefinition[] {
    return this.registry.map(e => ({
      id: e.id, name: e.name, domain: e.domain, source: e.source, unit: e.unit, description: e.description,
    }));
  }

  async getAllKpis(): Promise<KpiCatalogResponse> {
    const values = await this.fetchAllValues();
    const byDomain: Record<string, number> = {};
    for (const k of values) {
      byDomain[k.domain] = (byDomain[k.domain] ?? 0) + 1;
    }
    return { kpis: values, total: values.length, byDomain, generatedAt: new Date().toISOString() };
  }

  async searchKpis(query: KpiSearchQueryDto): Promise<KpiCatalogResponse> {
    let values = await this.fetchAllValues();
    if (query.domain) values = values.filter(k => k.domain === query.domain);
    if (query.search) {
      const q = query.search.toLowerCase();
      values = values.filter(k => k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q));
    }
    if (query.status) values = values.filter(k => k.status === query.status);
    const byDomain: Record<string, number> = {};
    for (const k of values) {
      byDomain[k.domain] = (byDomain[k.domain] ?? 0) + 1;
    }
    return { kpis: values, total: values.length, byDomain, generatedAt: new Date().toISOString() };
  }

  async getKpiDetail(id: string): Promise<KpiDetailResponse | null> {
    const entry = this.registry.find(e => e.id === id);
    if (!entry) return null;
    const value = await this.fetchSingleValue(entry);
    if (!value) return null;
    return {
      kpi: value,
      history: [],
      relatedKpis: [],
      generatedAt: new Date().toISOString(),
    };
  }

  async getKpiValue(id: string): Promise<KpiValue | null> {
    const entry = this.registry.find(e => e.id === id);
    if (!entry) return null;
    return this.fetchSingleValue(entry);
  }

  async getMultipleKpiValues(ids: string[]): Promise<Map<string, KpiValue | null>> {
    const results = new Map<string, KpiValue | null>();
    const entries = this.registry.filter(e => ids.includes(e.id));
    const fetched = await Promise.allSettled(entries.map(e => this.fetchSingleValue(e)));
    for (let i = 0; i < entries.length; i++) {
      const f = fetched[i];
      results.set(entries[i].id, f.status === 'fulfilled' ? f.value : null);
    }
    return results;
  }

  private async fetchSingleValue(entry: KpiRegistryEntry): Promise<KpiValue | null> {
    try {
      const { current, previous } = await entry.fetcher();
      const change = current !== null && previous !== null ? current - previous : null;
      const changePercent = previous !== null && previous !== 0 && change !== null ? Math.round((change / Math.abs(previous)) * 100) : null;
      const status = this.computeStatus(entry.domain, current);
      const trend = this.computeTrend(change);
      return {
        id: entry.id, name: entry.name, domain: entry.domain, source: entry.source, unit: entry.unit,
        description: entry.description, currentValue: current, previousValue: previous,
        change, changePercent, status, trend, updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch KPI ${entry.id}: ${err}`);
      return null;
    }
  }

  private async fetchAllValues(): Promise<KpiValue[]> {
    const results = await Promise.allSettled(this.registry.map(e => this.fetchSingleValue(e)));
    return results.filter((r): r is PromiseFulfilledResult<KpiValue> => r.status === 'fulfilled' && r.value !== null).map(r => r.value!);
  }

  private computeStatus(domain: string, value: number | null): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (value === null) return 'unknown';
    if (domain === 'health' || domain === 'trust') {
      if (value >= 70) return 'healthy';
      if (value >= 40) return 'warning';
      return 'critical';
    }
    if (domain === 'revenue' || domain === 'growth') {
      if (value >= 0) return 'healthy';
      if (value >= -10) return 'warning';
      return 'critical';
    }
    if (value >= 0) return 'healthy';
    return 'warning';
  }

  private computeTrend(change: number | null): 'up' | 'down' | 'stable' | 'unknown' {
    if (change === null) return 'unknown';
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }
}
