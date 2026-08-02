import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  CATALOG_ITEMS_INDEX,
  CATALOG_CATEGORIES_INDEX,
  INDEX_MAPPINGS,
} from './tradfind.config';
import { SearchEntity } from './enums/search.enums';

@Injectable()
export class TradfindService {
  private readonly logger = new Logger(TradfindService.name);

  constructor(
    private readonly prisma: PrismaService,
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
    const start = Date.now();
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    const [products, companies, categories, industries, catalogCategories, catalogItems] = await Promise.all([
      this.searchInIndex(PRODUCTS_INDEX, dto.q, { status: 'ACTIVE' }, page, limit),
      this.searchInIndex(COMPANIES_INDEX, dto.q, { status: ['ACTIVE', 'VERIFIED'] }, page, limit),
      this.searchInIndex(CATEGORIES_INDEX, dto.q, { isActive: true }, page, limit),
      this.searchInIndex(INDUSTRIES_INDEX, dto.q, {}, page, limit),
      this.searchInIndex(CATALOG_CATEGORIES_INDEX, dto.q, {}, page, limit),
      this.searchInIndex(CATALOG_ITEMS_INDEX, dto.q, {}, page, limit),
    ]);

    const total = products.total + companies.total + categories.total + industries.total;
    const catalogTotal = catalogCategories.total + catalogItems.total;

    this.logger.log(
      `globalSearch q="${dto.q}" duration=${Date.now() - start}ms ` +
      `hits={products:${products.total} companies:${companies.total} categories:${categories.total} ` +
      `industries:${industries.total} catalogCategories:${catalogCategories.total} catalogItems:${catalogItems.total}}`,
    );

    await this.trendingSearchService.trackSearch(dto.q);
    this.trackSearchAnalytics(dto.q, SearchEntity.PRODUCTS, total, dto.latitude, dto.longitude).catch((err) => this.logger.warn(`Search analytics track failed: ${(err as Error).message}`));

    return {
      products: products.hits,
      companies: companies.hits,
      categories: categories.hits,
      industries: industries.hits,
      catalogCategories: catalogCategories.hits,
      catalogItems: catalogItems.hits,
      meta: { total: total + catalogTotal, page, limit: dto.limit || 10 },
    };
  }

  async productSearch(dto: ProductSearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    const start = Date.now();
    let productResult: UnifiedSearchResult<Record<string, unknown>>;
    let catalogResult: UnifiedSearchResult<Record<string, unknown>>;
    try {
      [productResult, catalogResult] = await Promise.all([
        this.productSearchService.search(dto),
        this.searchInIndex(CATALOG_ITEMS_INDEX, dto.q || '', {}, dto.page || 1, dto.limit || 20),
      ]);
    } catch (err) {
      this.logger.warn(`Product search failed, returning empty: ${(err as Error).message}`);
      return { hits: [], total: 0, page: dto.page || 1, limit: dto.limit || 20 } as UnifiedSearchResult<Record<string, unknown>>;
    }

    const enrichedHits = [
      ...productResult.hits,
      ...catalogResult.hits.map((hit) => ({ ...hit, _sourceType: 'catalog' })),
    ];

    this.logger.log(
      `productSearch q="${dto.q}" duration=${Date.now() - start}ms ` +
      `hits={products:${productResult.total} catalogItems:${catalogResult.total}} ` +
      `rankingSource=opensearch`,
    );

    await this.trendingSearchService.trackSearch(dto.q || '');
    this.trackSearchAnalytics(dto.q || '', SearchEntity.PRODUCTS, productResult.total, dto.latitude, dto.longitude).catch((err) => this.logger.warn(`Search analytics track failed: ${(err as Error).message}`));

    return {
      hits: enrichedHits,
      total: productResult.total + catalogResult.total,
      page: productResult.page,
      limit: productResult.limit,
    } as UnifiedSearchResult<Record<string, unknown>>;
  }

  async companySearch(dto: CompanySearchDto): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    let result: UnifiedSearchResult<Record<string, unknown>>;
    try {
      result = await this.companySearchService.search(dto);
    } catch (err) {
      this.logger.warn(`Company search failed, returning empty: ${(err as Error).message}`);
      return { hits: [], total: 0, page: dto.page || 1, limit: dto.limit || 20 } as UnifiedSearchResult<Record<string, unknown>>;
    }
    await this.trendingSearchService.trackSearch(dto.q || '');
    this.trackSearchAnalytics(dto.q || '', SearchEntity.COMPANIES, result.total, dto.latitude, dto.longitude).catch((err) => this.logger.warn(`Search analytics track failed: ${(err as Error).message}`));
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

  async searchCatalog(
    q: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<UnifiedSearchResult<Record<string, unknown>>> {
    try {
      return await this.searchService.search<Record<string, unknown>>(
        CATALOG_ITEMS_INDEX,
        q,
        {},
        { page, limit },
      );
    } catch (err) {
      this.logger.warn(`Catalog search failed, returning empty: ${(err as Error).message}`);
      return { hits: [], total: 0, page, limit };
    }
  }

  async reindexCatalog(): Promise<{ categories: number; items: number }> {
    this.logger.log('Starting Master Catalog reindexing...');

    try {
      // 1. Recreate indices
      await this.searchService.deleteIndex(CATALOG_CATEGORIES_INDEX).catch(() => {});
      await this.searchService.createIndex(
        CATALOG_CATEGORIES_INDEX,
        INDEX_MAPPINGS[CATALOG_CATEGORIES_INDEX],
      );

      await this.searchService.deleteIndex(CATALOG_ITEMS_INDEX).catch(() => {});
      await this.searchService.createIndex(
        CATALOG_ITEMS_INDEX,
        INDEX_MAPPINGS[CATALOG_ITEMS_INDEX],
      );

      // 2. Fetch and index Catalog Categories and Subcategories
      const categories = await this.prisma.catalogCategory.findMany({
        where: { isActive: true },
        include: { subcategories: true },
      });

      let categoryCount = 0;
      for (const cat of categories) {
        try {
          await this.searchService.indexDocument(CATALOG_CATEGORIES_INDEX, cat.id, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            path: cat.name,
            parent: null,
            level: 0,
            createdAt: cat.createdAt,
          });
        } catch (err) {
          this.logger.warn(`Failed to index category ${cat.id}: ${(err as Error).message}`);
        }
        categoryCount++;

        for (const sub of cat.subcategories) {
          try {
            await this.searchService.indexDocument(CATALOG_CATEGORIES_INDEX, sub.id, {
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              path: `${cat.name} > ${sub.name}`,
              parent: cat.id,
              level: 1,
              createdAt: sub.createdAt,
            });
          } catch (err) {
            this.logger.warn(`Failed to index subcategory ${sub.id}: ${(err as Error).message}`);
          }
          categoryCount++;
        }
      }

      // 3. Fetch and index Catalog Items
      const items = await this.prisma.catalogItem.findMany({
        where: { isActive: true },
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
          attributes: { where: { isActive: true } },
        },
      });

      let itemCount = 0;
      for (const item of items) {
        try {
          const categoryPath = `${item.subcategory.category.name} > ${item.subcategory.name}`;
          const attributesMapped = item.attributes.map((attr) => ({
            key: attr.key,
            value: attr.value,
          }));

          await this.searchService.indexDocument(CATALOG_ITEMS_INDEX, item.id, {
            id: item.id,
            name: item.name,
            type: item.type,
            slug: item.slug,
            unit: item.unit || null,
            altUnits: item.altUnits || null,
            quantityParams: item.quantityParams || null,
            keywords: item.keywords,
            synonyms: item.synonyms,
            categoryPath,
            attributes: attributesMapped,
            createdAt: item.createdAt,
          });
          itemCount++;
        } catch (err) {
          this.logger.warn(`Failed to index catalog item ${item.id}: ${(err as Error).message}`);
        }
      }

      this.logger.log(
        `Master Catalog reindexing complete. Indexed ${categoryCount} categories/subcategories and ${itemCount} items.`,
      );
      return { categories: categoryCount, items: itemCount };
    } catch (err) {
      this.logger.error(`Master Catalog reindexing failed: ${(err as Error).message}`);
      throw err;
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
