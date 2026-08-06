import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SynonymIntelligenceService } from './synonym-intelligence.service';
import { EnterpriseRankingService, RankableResult } from './enterprise-ranking.service';
import { EnterpriseSearchAnalyticsService } from './enterprise-search-analytics.service';
import {
  ENTERPRISE_BRANDS_INDEX,
  ENTERPRISE_ATTRIBUTES_INDEX,
  ENTERPRISE_SYNONYMS_INDEX,
  ENTERPRISE_MAPPINGS_INDEX,
  ENTERPRISE_SEARCH_INDICES,
  ENTERPRISE_INDEX_MAPPINGS,
} from '../config/enterprise-search.config';
import { EnterpriseSearchDto } from '../dto/enterprise-search.dto';

interface IndexSearchResult {
  hits: Record<string, unknown>[];
  total: number;
  entityType: string;
}

@Injectable()
export class EnterpriseSearchService {
  private readonly logger = new Logger(EnterpriseSearchService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
    private readonly synonymService: SynonymIntelligenceService,
    private readonly rankingService: EnterpriseRankingService,
    private readonly analytics: EnterpriseSearchAnalyticsService,
  ) {}

  async search(dto: EnterpriseSearchDto, companyId?: string, userId?: string) {
    const start = Date.now();
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    let expandedQuery = dto.q;
    let synonymMatch = false;
    if (dto.useSynonyms !== false) {
      const expansion = await this.synonymService.expandQuery(dto.q);
      if (expansion.expanded.length > 0) {
        expandedQuery = expansion.expanded.join(' ');
        synonymMatch = expansion.synonyms.length > 0;
      }
    }

    const entities = dto.entityTypes && dto.entityTypes.length > 0
      ? dto.entityTypes
      : ['brand', 'attribute', 'synonym', 'category', 'industry'];

    const results: IndexSearchResult[] = [];

    const searchPromises = entities.map(async (entityType) => {
      const index = this.getIndexForEntity(entityType);
      if (!index) return null;

      if (entityType === 'category') {
        return this.searchCategories(expandedQuery, dto.q, dto);
      }
      if (entityType === 'industry') {
        return this.searchIndustries(expandedQuery, dto.q, dto);
      }
      try {
        const filters: Record<string, string | number | boolean | undefined> = {};
        if (entityType === 'brand' && dto.brandCountry) filters.country = dto.brandCountry;
        if (entityType === 'attribute' && dto.attributeType) filters.type = dto.attributeType;
        filters.isActive = true;

        const searchResult = await this.searchService.search<Record<string, unknown>>(
          index, expandedQuery, filters, { page, limit },
        );
        return { hits: searchResult.hits, total: searchResult.total, entityType };
      } catch (err) {
        this.logger.warn(`Search in ${index} failed: ${(err as Error).message}`);
        return { hits: [], total: 0, entityType };
      }
    });

    const settled = await Promise.all(searchPromises);
    for (const r of settled) {
      if (r) results.push(r);
    }

    const allHits = results.flatMap(r => r.hits);
    const total = results.reduce((s, r) => s + r.total, 0);

    let ranked: Record<string, unknown>[] = allHits;
    if (allHits.length > 0) {
      const rankable: RankableResult[] = allHits.map(h => ({
        id: (h.id as string) || '',
        name: (h.name as string) || '',
        entityType: (h._sourceType as string) || '',
        score: (h._score as number) || 0,
        matchType: this.determineMatchType(h, dto.q, expandedQuery),
        verificationLevel: h.verificationStatus as string || h.verificationLevel as string,
        popularity: (h.total as number) || (h.sortOrder as number),
        createdAt: h.createdAt ? new Date(h.createdAt as string) : undefined,
        isActive: h.isActive as boolean,
      }));
      ranked = this.rankingService.rankResults(rankable);
    }

    const latencyMs = Date.now() - start;

    this.analytics.trackSearch({
      query: dto.q,
      entityType: entities.join(','),
      resultCount: total,
      companyId,
      userId,
      filters: { entityTypes: entities, useSynonyms: dto.useSynonyms, useAi: dto.useAi },
      latencyMs,
    }).catch((err) => this.logger.warn(`Enterprise search analytics track failed: ${(err as Error).message}`));

    this.analytics.trackTrending(dto.q.toLowerCase().trim()).catch((err) => this.logger.warn(`Trending analytics track failed: ${(err as Error).message}`));

    return {
      data: ranked.slice(0, limit),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), synonymExpanded: synonymMatch, latencyMs, expandedQuery },
      byEntity: results.reduce((acc, r) => ({ ...acc, [r.entityType]: { total: r.total } }), {} as Record<string, { total: number }>),
    };
  }

  async autocomplete(q: string, limit: number = 10) {
    const lowercase = q.toLowerCase().trim();
    if (!lowercase) return [];

    const [brands, attributes, categories, industries] = await Promise.all([
      this.searchService.search<Record<string, unknown>>(ENTERPRISE_BRANDS_INDEX, lowercase, { isActive: true }, { page: 1, limit }),
      this.searchService.search<Record<string, unknown>>(ENTERPRISE_ATTRIBUTES_INDEX, lowercase, { isActive: true }, { page: 1, limit }),
      this.searchCategories(lowercase, lowercase, { page: 1, limit: 5 } as any),
      this.searchIndustries(lowercase, lowercase, { page: 1, limit: 5 } as any),
    ]);

    const suggestions = [
      ...brands.hits.map(h => ({ text: h.name as string, type: 'brand' as const, slug: h.slug as string })),
      ...attributes.hits.map(h => ({ text: h.name as string, type: 'attribute' as const, slug: h.slug as string })),
      ...categories.hits.map(h => ({ text: h.name as string, type: 'category' as const, slug: h.slug as string })),
      ...industries.hits.map(h => ({ text: h.name as string, type: 'industry' as const, slug: h.slug as string })),
    ];

    return suggestions.slice(0, limit);
  }

  async getSuggestions(userId?: string, limit: number = 10, entityType?: string, recentLimit: number = 5) {
    const [trending, recent] = await Promise.all([
      this.analytics.getTopQueries(entityType, 7, limit),
      userId
        ? this.prisma.recentSearch.findMany({ where: { userId }, orderBy: { timestamp: 'desc' }, take: recentLimit })
        : Promise.resolve([]),
    ]);

    return {
      trending: trending.map(t => ({ text: t.query, count: t.count, source: 'trending' as const })),
      recent: recent.map(r => ({ text: r.query, source: 'recent' as const, timestamp: r.timestamp })),
    };
  }

  async reindex(entityTypes?: string[]): Promise<Record<string, number>> {
    const types = entityTypes ?? ['brand', 'attribute', 'synonym', 'mapping'];
    const counts: Record<string, number> = {};

    for (const entityType of types) {
      const index = this.getIndexForEntity(entityType);
      if (!index) continue;

      try {
        await this.searchService.deleteIndex(index);
      } catch { /* may not exist */ }
      await this.searchService.createIndex(index, ENTERPRISE_INDEX_MAPPINGS[index]);
      counts[index] = await this.indexDocuments(entityType, index);
    }

    return counts;
  }

  async getIndexHealth(indices?: string[]) {
    const checkIndices = indices ?? [...ENTERPRISE_SEARCH_INDICES];
    const health: Record<string, { exists: boolean; docCount?: number }> = {};

    for (const index of checkIndices) {
      try {
        const exists = await this.searchService.indexExists(index);
        health[index] = { exists };
      } catch {
        health[index] = { exists: false };
      }
    }

    return {
      indices: health,
      allExist: Object.values(health).every(h => h.exists),
      totalIndices: Object.keys(health).length,
      healthyIndices: Object.values(health).filter(h => h.exists).length,
    };
  }

  private async searchCategories(query: string, originalQuery: string, dto: Partial<EnterpriseSearchDto>): Promise<IndexSearchResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    try {
      const where: any = { isActive: true };
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.category.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { sortOrder: 'asc' } }),
        this.prisma.category.count({ where }),
      ]);
      return { hits: data.map(d => ({ ...d, _sourceType: 'category' })), total, entityType: 'category' };
    } catch {
      return { hits: [], total: 0, entityType: 'category' };
    }
  }

  private async searchIndustries(query: string, originalQuery: string, dto: Partial<EnterpriseSearchDto>): Promise<IndexSearchResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    try {
      const where: any = {};
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }
      const [data, total] = await Promise.all([
        this.prisma.industry.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { name: 'asc' } }),
        this.prisma.industry.count({ where }),
      ]);
      return { hits: data.map(d => ({ ...d, _sourceType: 'industry' })), total, entityType: 'industry' };
    } catch {
      return { hits: [], total: 0, entityType: 'industry' };
    }
  }

  private async indexDocuments(entityType: string, index: string): Promise<number> {
    try {
      let docs: Record<string, unknown>[] = [];

      switch (entityType) {
        case 'brand': {
          const brands = await this.prisma.globalBrand.findMany({ where: { isActive: true } });
          docs = brands.map(b => ({
            id: b.id, name: b.name, slug: b.slug, aliases: b.aliases,
            manufacturer: b.manufacturer, country: b.country, description: b.description,
            verificationStatus: b.verificationStatus, isActive: b.isActive,
            name_suggest: { input: [b.name, ...(b.aliases || [])], weight: 2 },
          }));
          break;
        }
        case 'attribute': {
          const attrs = await this.prisma.globalAttribute.findMany({ where: { isActive: true } });
          docs = attrs.map(a => ({
            id: a.id, name: a.name, slug: a.slug, label: a.label,
            type: a.type, unit: a.unit, options: a.options,
            isActive: a.isActive, sortOrder: a.sortOrder,
            name_suggest: { input: [a.name, a.label].filter(Boolean), weight: 1 },
          }));
          break;
        }
        case 'synonym': {
          const syns = await this.prisma.catalogSynonym.findMany({ where: { isActive: true } });
          docs = syns.map(s => ({
            id: s.id, term: s.term, synonyms: s.synonyms,
            locale: s.locale, isActive: s.isActive,
          }));
          break;
        }
        case 'mapping': {
          const mappings = await this.prisma.industryCategoryMapping.findMany({
            where: { isActive: true },
            include: { industry: true, category: true },
          });
          docs = mappings.map(m => ({
            id: m.id, industryId: m.industryId, industryName: m.industry.name,
            categoryId: m.categoryId, categoryName: m.category.name,
            description: m.description, isActive: m.isActive,
          }));
          break;
        }
      }

      await Promise.all(docs.map(doc => this.searchService.indexDocument(index, doc.id as string, doc)));
      return docs.length;
    } catch (err) {
      this.logger.error(`Failed to index ${entityType}: ${(err as Error).message}`);
      return 0;
    }
  }

  private getIndexForEntity(entityType: string): string | null {
    const map: Record<string, string> = {
      brand: ENTERPRISE_BRANDS_INDEX,
      attribute: ENTERPRISE_ATTRIBUTES_INDEX,
      synonym: ENTERPRISE_SYNONYMS_INDEX,
      mapping: ENTERPRISE_MAPPINGS_INDEX,
    };
    return map[entityType] ?? null;
  }

  private determineMatchType(hit: Record<string, unknown>, original: string, expanded: string): 'exact' | 'synonym' | 'fuzzy' | 'prefix' | 'partial' {
    const name = ((hit.name as string) || '').toLowerCase();
    const q = original.toLowerCase().trim();

    if (name === q) return 'exact';
    if (name.startsWith(q)) return 'prefix';
    if (name.includes(q)) return 'partial';

    const expLower = expanded.toLowerCase();
    if (name.includes(expLower)) return 'synonym';

    return 'fuzzy';
  }

}
