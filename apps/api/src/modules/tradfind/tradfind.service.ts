import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { ProductSearchService } from './services/product-search.service';
import { CompanySearchService } from './services/company-search.service';
import { GeoSearchService } from './services/geo-search.service';
import { SearchRankingService } from './services/search-ranking.service';
import { AutocompleteService } from './services/autocomplete.service';
import { SuggestionsService } from './services/suggestions.service';
import { RecentSearchService } from './services/recent-search.service';
import { TrendingSearchService } from './services/trending-search.service';
import { DiscoveryFeedService } from './services/discovery-feed.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { GlobalSearchDto } from './dto/global-search.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { CompanySearchDto } from './dto/company-search.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';
import { SuggestionsDto } from './dto/suggestions.dto';
import { DiscoveryFeedDto } from './dto/discovery-feed.dto';
import {
  GlobalSearchResponse,
  UnifiedSearchResult,
  AutocompleteResult,
  SearchSuggestion,
  RecentSearchEntry,
  TrendingSearchEntry,
  DiscoveryFeedResponse,
} from './interfaces/search-types';
import {
  PRODUCTS_INDEX,
  COMPANIES_INDEX,
  CATEGORIES_INDEX,
  INDUSTRIES_INDEX,
} from './tradfind.config';
import { SearchEntity } from './enums/search.enums';

@Injectable()
export class TradfindService {
  private readonly logger = new Logger(TradfindService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly productSearchService: ProductSearchService,
    private readonly companySearchService: CompanySearchService,
    private readonly geoSearchService: GeoSearchService,
    private readonly rankingService: SearchRankingService,
    private readonly autocompleteService: AutocompleteService,
    private readonly suggestionsService: SuggestionsService,
    private readonly recentSearchService: RecentSearchService,
    private readonly trendingSearchService: TrendingSearchService,
    private readonly discoveryFeedService: DiscoveryFeedService,
    private readonly searchAnalyticsService: SearchAnalyticsService,
  ) {}

  async globalSearch(dto: GlobalSearchDto): Promise<GlobalSearchResponse> {
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const [products, companies, categories, industries] = await Promise.all([
      this.searchInIndex(PRODUCTS_INDEX, dto.q, { status: 'ACTIVE' }, page, limit),
      this.searchInIndex(COMPANIES_INDEX, dto.q, { status: ['ACTIVE', 'VERIFIED'] }, page, limit),
      this.searchInIndex(CATEGORIES_INDEX, dto.q, { isActive: true }, page, limit),
      this.searchInIndex(INDUSTRIES_INDEX, dto.q, {}, page, limit),
    ]);

    const total = products.total + companies.total + categories.total + industries.total;

    await this.trendingSearchService.trackSearch(dto.q);
    this.trackSearchAnalytics(dto.q, SearchEntity.PRODUCTS, total, dto.latitude, dto.longitude).catch(() => {});

    return {
      products: products.hits,
      companies: companies.hits,
      categories: categories.hits,
      industries: industries.hits,
      meta: { total, page, limit: dto.limit || 10 },
    };
  }

  async productSearch(dto: ProductSearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    const result = await this.productSearchService.search(dto);
    await this.trendingSearchService.trackSearch(dto.q || '');
    this.trackSearchAnalytics(dto.q || '', SearchEntity.PRODUCTS, result.total, dto.latitude, dto.longitude).catch(() => {});
    return result;
  }

  async companySearch(dto: CompanySearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    const result = await this.companySearchService.search(dto);
    await this.trendingSearchService.trackSearch(dto.q || '');
    this.trackSearchAnalytics(dto.q || '', SearchEntity.COMPANIES, result.total, dto.latitude, dto.longitude).catch(() => {});
    return result;
  }

  async autocomplete(dto: AutocompleteDto): Promise<AutocompleteResult[]> {
    return this.autocompleteService.autocomplete(dto.q, dto.limit);
  }

  async getSuggestions(dto: SuggestionsDto): Promise<SearchSuggestion[]> {
    return this.suggestionsService.getSuggestions(dto.limit);
  }

  async getRecentSearches(userId: string, limit: number = 10): Promise<RecentSearchEntry[]> {
    return this.recentSearchService.getRecentSearches(userId, limit);
  }

  async deleteRecentSearches(userId: string, searchId?: string): Promise<void> {
    return this.recentSearchService.deleteSearch(userId, searchId);
  }

  async getTrendingSearches(
    limit: number = 10,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<TrendingSearchEntry[]> {
    return this.trendingSearchService.getTrendingSearches(limit, period);
  }

  async getDiscoveryFeed(dto: DiscoveryFeedDto): Promise<DiscoveryFeedResponse> {
    return this.discoveryFeedService.getFeed(dto.page, dto.limit, dto.latitude, dto.longitude);
  }

  private async searchInIndex(
    index: string,
    query: string,
    filters: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    try {
      const osFilters: Record<string, string | number | boolean | undefined> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          continue;
        }
        osFilters[key] = value as string | number | boolean | undefined;
      }

      const result = await this.searchService.search<Record<string, unknown>>(
        index,
        query,
        osFilters,
        { page, limit },
      );
      return result;
    } catch (err) {
      this.logger.warn(`Search in ${index} failed: ${(err as Error).message}`);
      return { hits: [], total: 0, page, limit };
    }
  }

  private async trackSearchAnalytics(
    query: string,
    entityType: SearchEntity,
    resultCount: number,
    latitude?: number,
    longitude?: number,
  ): Promise<void> {
    try {
      await this.searchAnalyticsService.trackSearch({
        query,
        entityType,
        resultCount,
        latitude,
        longitude,
        timestamp: new Date(),
      });
    } catch (err) {
      this.logger.warn(`Failed to track search analytics: ${(err as Error).message}`);
    }
  }
}
