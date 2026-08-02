import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { GeoSearchService } from './geo-search.service';
import { SearchRankingService } from './search-ranking.service';
import { UnifiedRankingService } from './unified-ranking.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { ProductSearchDto } from '../dto/product-search.dto';
import { SearchSort } from '../enums/search.enums';
import { UnifiedSearchResult, FacetCount, SearchFacets, SpellCorrection } from '../interfaces/search-types';
import { PRODUCTS_INDEX } from '../tradfind.config';

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);
  private synonymCache: Map<string, string[]> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    private readonly searchService: SearchService,
    private readonly geoSearchService: GeoSearchService,
    private readonly rankingService: SearchRankingService,
    private readonly unifiedRanking: UnifiedRankingService,
    private readonly prisma: PrismaService,
    private readonly searchAnalytics: SearchAnalyticsService,
  ) {}

  async search(dto: ProductSearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const from = (page - 1) * limit;

    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];
    const should: Record<string, unknown>[] = [];

    let queryText = dto.q || '';

    if (queryText) {
      const expanded = await this.expandWithSynonyms(queryText);
      must.push({
        multi_match: {
          query: expanded,
          fields: [
            'name^3',
            'name.autocomplete^2',
            'brand^2',
            'shortDescription',
            'description',
            'sku',
            'categoryName',
            'companyName',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 2,
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (dto.categoryId) filter.push({ term: { categoryId: dto.categoryId } });
    if (dto.subCategory) filter.push({ term: { subCategory: dto.subCategory } });
    if (dto.industryId) filter.push({ term: { industryId: dto.industryId } });
    if (dto.productType) filter.push({ term: { productType: dto.productType } });
    if (dto.verificationLevel) filter.push({ term: { verificationLevel: dto.verificationLevel } });
    if (dto.verified) {
      filter.push({
        terms: { verificationLevel: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4'] },
      });
    }
    if (dto.businessType) filter.push({ term: { businessType: dto.businessType } });
    if (dto.sellerType) {
      filter.push({ term: { businessType: dto.sellerType.toUpperCase() } });
    }
    if (dto.brand) filter.push({ term: { brand: dto.brand } });
    if (dto.minPrice !== undefined) filter.push({ range: { minPrice: { gte: dto.minPrice } } });
    if (dto.maxPrice !== undefined) filter.push({ range: { maxPrice: { lte: dto.maxPrice } } });
    if (dto.moq !== undefined) filter.push({ range: { moq: { lte: dto.moq } } });
    if (dto.minMoq !== undefined) filter.push({ range: { moq: { gte: dto.minMoq } } });
    if (dto.minTrustScore !== undefined) {
      filter.push({ range: { trustScoreSnapshot: { gte: dto.minTrustScore } } });
    }
    if (dto.city) filter.push({ term: { city: dto.city } });
    if (dto.state) filter.push({ term: { state: dto.state } });

    filter.push({ term: { status: 'ACTIVE' } });

    const coords = this.resolveCoords(dto);
    const hasGeo = !!(coords.latitude !== undefined && coords.longitude !== undefined && coords.radius);
    if (hasGeo) {
      filter.push(
        this.geoSearchService.buildGeoDistanceFilter({
          lat: coords.latitude!,
          lon: coords.longitude!,
          radiusKm: coords.radius!,
        }),
      );
    }

    const sort = this.buildSort(dto, hasGeo);

    const body: Record<string, unknown> = {
      query: {
        bool: {
          must,
          filter: filter.length > 0 ? filter : undefined,
          should: should.length > 0 ? should : undefined,
        },
      },
      sort,
      from,
      size: limit,
      track_scores: true,
    };

    if (dto.includeFacets) {
      body.aggs = {
        categories: { terms: { field: 'categoryName', size: 20 } },
        industries: { terms: { field: 'industryName', size: 20 } },
        verificationLevels: { terms: { field: 'verificationLevel', size: 10 } },
        businessTypes: { terms: { field: 'businessType', size: 10 } },
        cities: { terms: { field: 'city', size: 20 } },
        states: { terms: { field: 'state', size: 20 } },
        brands: { terms: { field: 'brand', size: 20 } },
        priceRanges: {
          range: {
            field: 'minPrice',
            ranges: [
              { key: 'Under ₹500', to: 500 },
              { key: '₹500 - ₹2,000', from: 500, to: 2000 },
              { key: '₹2,000 - ₹10,000', from: 2000, to: 10000 },
              { key: '₹10,000 - ₹50,000', from: 10000, to: 50000 },
              { key: '₹50,000+', from: 50000 },
            ],
          },
        },
      };
    }

    try {
      const openSearchClient = (this.searchService as any).client;
      const osResponse = await openSearchClient.search({
        index: PRODUCTS_INDEX,
        body,
      });

      const profile = dto.sort === SearchSort.DISTANCE ? 'nearme' : 'tradfind';
      const hits = osResponse.body.hits.hits.map((hit: any) => {
        const source = hit._source || {};
        const score = this.rankingService.calculateScore({
          relevanceScore: hit._score || 0,
          distance: hit.sort?.[0] as number | undefined,
          maxDistance: dto.radius,
          trustScore: (source.trustScoreSnapshot as number) || 0,
          verificationLevel: (source.verificationLevel as string) || 'LEVEL_0',
          createdAt: new Date((source.createdAt as string) || Date.now()),
        });
        const unified = this.unifiedRanking.computeScore({
          relevanceScore: score.totalScore,
          distance: hit.sort?.[0] as number | undefined,
          maxDistance: dto.radius,
          trustScore: (source.trustScoreSnapshot as number) || 0,
          verificationLevel: (source.verificationLevel as string) || 'LEVEL_0',
          createdAt: new Date((source.createdAt as string) || Date.now()),
          profile,
        });
        return {
          id: hit._id,
          ...source,
          _ranking: score,
          _unifiedRanking: unified,
        };
      });

      const rankedHits = this.unifiedRanking.reorderByScore(hits, (h) => h._unifiedRanking);

      const totalInfo = osResponse.body.hits.total;
      const total = typeof totalInfo === 'number' ? totalInfo : totalInfo?.value ?? 0;

      const result: UnifiedSearchResult<Record<string, unknown>> = {
        hits: rankedHits,
        total,
        page,
        limit,
      };

      if (dto.includeFacets && osResponse.body.aggregations) {
        result.facets = this.parseAggregations(osResponse.body.aggregations);
      }

      if (total === 0 && queryText && queryText.length > 2) {
        result.spellCorrection = await this.suggestCorrection(queryText);
      }

      return result;
    } catch (err) {
      this.logger.error(`Product search failed: ${(err as Error).message}`);
      return { hits: [], total: 0, page, limit };
    }
  }

  private parseAggregations(aggs: any): SearchFacets {
    const parse = (data: any): FacetCount[] =>
      (data?.buckets || []).map((b: any) => ({ key: String(b.key), doc_count: b.doc_count }));
    return {
      categories: parse(aggs.categories),
      industries: parse(aggs.industries),
      verificationLevels: parse(aggs.verificationLevels),
      businessTypes: parse(aggs.businessTypes),
      cities: parse(aggs.cities),
      states: parse(aggs.states),
      brands: parse(aggs.brands),
      priceRanges: (aggs.priceRanges?.buckets || []).map((b: any) => ({
        key: String(b.key), from: b.from, to: b.to, doc_count: b.doc_count,
      })),
    };
  }

  private async expandWithSynonyms(query: string): Promise<string> {
    await this.refreshSynonymCache();
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const expansions: string[] = [];
    for (const token of tokens) {
      const syns = this.synonymCache.get(token);
      if (syns && syns.length > 0) expansions.push(...syns);
    }
    if (expansions.length === 0) return query;
    const all = [...tokens, ...expansions];
    return [...new Set(all)].join(' ');
  }

  private async refreshSynonymCache(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL && this.synonymCache.size > 0) return;
    try {
      const synonyms = await this.prisma.catalogSynonym.findMany({ where: { isActive: true } });
      this.synonymCache.clear();
      for (const syn of synonyms) {
        const term = syn.term.toLowerCase();
        this.synonymCache.set(term, syn.synonyms.map(s => s.toLowerCase()));
        for (const s of syn.synonyms) {
          const key = s.toLowerCase();
          const existing = this.synonymCache.get(key);
          if (!existing) this.synonymCache.set(key, [term]);
          else if (!existing.includes(term)) existing.push(term);
        }
      }
      this.cacheTimestamp = now;
    } catch (err) {
      this.logger.warn(`Synonym cache refresh failed: ${(err as Error).message}`);
    }
  }

  private async suggestCorrection(query: string): Promise<SpellCorrection | undefined> {
    try {
      const popular = await this.searchAnalytics.getPopularQueries(100);
      const candidates = popular
        .map(p => ({ query: p.query, dist: this.levenshtein(query.toLowerCase(), p.query.toLowerCase()) }))
        .filter(c => c.dist > 0 && c.dist <= Math.max(2, Math.floor(query.length / 3)))
        .sort((a, b) => a.dist - b.dist);
      if (candidates.length > 0) {
        return { suggested: candidates[0].query, original: query };
      }
    } catch (err) {
      this.logger.warn(`Spell correction failed: ${(err as Error).message}`);
    }
    return undefined;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  private resolveCoords(dto: ProductSearchDto): {
    latitude?: number;
    longitude?: number;
    radius?: number;
  } {
    return {
      latitude: dto.latitude ?? dto.lat,
      longitude: dto.longitude ?? dto.lng,
      radius: dto.radius ?? dto.kmRadius,
    };
  }

  private buildSort(dto: ProductSearchDto, hasGeo: boolean): Record<string, unknown>[] {
    const sort: Record<string, unknown>[] = [];
    const coords = this.resolveCoords(dto);

    switch (dto.sort) {
      case SearchSort.DISTANCE:
        if (hasGeo && coords.latitude && coords.longitude) {
          sort.push(...this.geoSearchService.buildGeoDistanceSort(coords.latitude, coords.longitude));
        }
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.TRUST_SCORE:
        sort.push({ trustScoreSnapshot: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.LATEST:
      case SearchSort.NEWEST:
        sort.push({ createdAt: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.POPULARITY:
        sort.push({ isFeatured: { order: 'desc' } });
        sort.push({ trustScoreSnapshot: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.RATING:
        sort.push({ trustScoreSnapshot: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.PRICE_ASC:
        sort.push({ minPrice: { order: 'asc', missing: '_last' } });
        break;
      case SearchSort.PRICE_DESC:
        sort.push({ minPrice: { order: 'desc', missing: '_last' } });
        break;
      case SearchSort.RELEVANCE:
      default:
        if (hasGeo && coords.latitude && coords.longitude) {
          sort.push(...this.geoSearchService.buildGeoDistanceSort(coords.latitude, coords.longitude));
        }
        sort.push({ _score: { order: 'desc' } });
        break;
    }

    return sort;
  }
}
