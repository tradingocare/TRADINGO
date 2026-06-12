import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { GeoSearchService } from './geo-search.service';
import { SearchRankingService } from './search-ranking.service';
import { ProductSearchDto } from '../dto/product-search.dto';
import { SearchSort } from '../enums/search.enums';
import { UnifiedSearchResult } from '../interfaces/search-types';
import { PRODUCTS_INDEX } from '../tradfind.config';

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly geoSearchService: GeoSearchService,
    private readonly rankingService: SearchRankingService,
  ) {}

  async search(dto: ProductSearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const from = (page - 1) * limit;

    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];
    const should: Record<string, unknown>[] = [];

    if (dto.q) {
      must.push({
        multi_match: {
          query: dto.q,
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
    if (dto.industryId) filter.push({ term: { industryId: dto.industryId } });
    if (dto.productType) filter.push({ term: { productType: dto.productType } });
    if (dto.verificationLevel) filter.push({ term: { verificationLevel: dto.verificationLevel } });
    if (dto.businessType) filter.push({ term: { businessType: dto.businessType } });
    if (dto.minPrice !== undefined) filter.push({ range: { minPrice: { gte: dto.minPrice } } });
    if (dto.maxPrice !== undefined) filter.push({ range: { maxPrice: { lte: dto.maxPrice } } });
    if (dto.moq !== undefined) filter.push({ range: { moq: { lte: dto.moq } } });
    if (dto.minTrustScore !== undefined) {
      filter.push({ range: { trustScoreSnapshot: { gte: dto.minTrustScore } } });
    }
    if (dto.city) filter.push({ term: { city: dto.city } });
    if (dto.state) filter.push({ term: { state: dto.state } });

    filter.push({ term: { status: 'ACTIVE' } });

    const hasGeo = !!(dto.latitude !== undefined && dto.longitude !== undefined && dto.radius);
    if (hasGeo) {
      filter.push(
        this.geoSearchService.buildGeoDistanceFilter({
          lat: dto.latitude!,
          lon: dto.longitude!,
          radiusKm: dto.radius!,
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

    try {
      const openSearchClient = (this.searchService as any).client;
      const osResponse = await openSearchClient.search({
        index: PRODUCTS_INDEX,
        body,
      });

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
        return {
          id: hit._id,
          ...source,
          _ranking: score,
        };
      });

      const totalInfo = osResponse.body.hits.total;
      const total = typeof totalInfo === 'number' ? totalInfo : totalInfo?.value ?? 0;

      return {
        hits,
        total,
        page,
        limit,
      };
    } catch (err) {
      this.logger.error(`Product search failed: ${(err as Error).message}`);
      return { hits: [], total: 0, page, limit };
    }
  }

  private buildSort(dto: ProductSearchDto, hasGeo: boolean): Record<string, unknown>[] {
    const sort: Record<string, unknown>[] = [];

    switch (dto.sort) {
      case SearchSort.DISTANCE:
        if (hasGeo && dto.latitude && dto.longitude) {
          sort.push(...this.geoSearchService.buildGeoDistanceSort(dto.latitude, dto.longitude));
        }
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.TRUST_SCORE:
        sort.push({ trustScoreSnapshot: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.LATEST:
        sort.push({ createdAt: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.POPULARITY:
        sort.push({ isFeatured: { order: 'desc' } });
        sort.push({ trustScoreSnapshot: { order: 'desc' } });
        sort.push({ _score: { order: 'desc' } });
        break;
      case SearchSort.RELEVANCE:
      default:
        if (hasGeo && dto.latitude && dto.longitude) {
          sort.push(...this.geoSearchService.buildGeoDistanceSort(dto.latitude, dto.longitude));
        }
        sort.push({ _score: { order: 'desc' } });
        break;
    }

    return sort;
  }
}
