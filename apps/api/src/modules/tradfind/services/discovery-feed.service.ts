import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { RedisService } from '../../../common/services/redis.service';
import { GeoSearchService } from './geo-search.service';
import { DiscoveryFeedItem, DiscoveryFeedResponse } from '../interfaces/search-types';
import {
  PRODUCTS_INDEX,
  COMPANIES_INDEX,
  CATEGORIES_INDEX,
} from '../tradfind.config';
import { DISCOVERY_FEED_CACHE_TTL } from '../enums/search.enums';

@Injectable()
export class DiscoveryFeedService {
  private readonly logger = new Logger(DiscoveryFeedService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly redisService: RedisService,
    private readonly geoSearchService: GeoSearchService,
  ) {}

  async getFeed(
    page: number = 1,
    limit: number = 20,
    latitude?: number,
    longitude?: number,
  ): Promise<DiscoveryFeedResponse> {
    const cacheKey = this.buildCacheKey(page, limit, latitude, longitude);

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as DiscoveryFeedResponse;
      }
    } catch {
      this.logger.warn('Failed to read discovery feed from cache');
    }

    const items: DiscoveryFeedItem[] = [];
    const perSection = Math.max(1, Math.ceil(limit / 6));

    const [trendingProducts, featuredCompanies, recentProducts, verifiedCompanies, popularCategories, dealsAndOffers] =
      await Promise.all([
        this.getTrendingProducts(perSection),
        this.getFeaturedCompanies(perSection, latitude, longitude),
        this.getRecentProducts(perSection),
        this.getVerifiedCompanies(perSection, latitude, longitude),
        this.getPopularCategories(perSection),
        this.getDealsAndOffers(perSection),
      ]);

    items.push(...trendingProducts);
    items.push(...featuredCompanies);
    items.push(...recentProducts);
    items.push(...verifiedCompanies);
    items.push(...popularCategories);
    items.push(...dealsAndOffers);

    const feed: DiscoveryFeedResponse = {
      items: items.slice(0, limit),
      meta: {
        total: items.length,
        page,
        limit,
      },
    };

    try {
      await this.redisService.set(cacheKey, JSON.stringify(feed), DISCOVERY_FEED_CACHE_TTL);
    } catch {
      this.logger.warn('Failed to cache discovery feed');
    }

    return feed;
  }

  private async getTrendingProducts(limit: number): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const response = await openSearchClient.search({
        index: PRODUCTS_INDEX,
        body: {
          query: {
            bool: {
              filter: [
                { term: { status: 'ACTIVE' } },
                { term: { isFeatured: true } },
              ],
            },
          },
          sort: [{ trustScoreSnapshot: { order: 'desc' } }],
          size: limit,
        },
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'product' as const,
        data: { id: hit._id, ...hit._source },
        reason: 'Trending Product',
      }));
    } catch (err) {
      this.logger.warn(`Failed to get trending products: ${(err as Error).message}`);
      return [];
    }
  }

  private async getFeaturedCompanies(
    limit: number,
    latitude?: number,
    longitude?: number,
  ): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const must: Record<string, unknown>[] = [{ match_all: {} }];
      const filter: Record<string, unknown>[] = [
        { terms: { status: ['ACTIVE', 'VERIFIED'] } },
      ];

      const body: Record<string, unknown> = {
        query: { bool: { must, filter } },
        sort: [{ trustScore: { order: 'desc' } }],
        size: limit,
      };

      if (latitude !== undefined && longitude !== undefined) {
        (body.query as any).bool.filter.push(
          this.geoSearchService.buildGeoDistanceFilter({
            lat: latitude,
            lon: longitude,
            radiusKm: 100,
          }),
        );
        (body as any).sort = [
          ...this.geoSearchService.buildGeoDistanceSort(latitude, longitude),
          { trustScore: { order: 'desc' } },
        ];
      }

      const response = await openSearchClient.search({
        index: COMPANIES_INDEX,
        body,
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'company' as const,
        data: { id: hit._id, ...hit._source },
        reason: latitude !== undefined && longitude !== undefined ? 'Near You' : 'Featured Company',
      }));
    } catch (err) {
      this.logger.warn(`Failed to get featured companies: ${(err as Error).message}`);
      return [];
    }
  }

  private async getRecentProducts(limit: number): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const response = await openSearchClient.search({
        index: PRODUCTS_INDEX,
        body: {
          query: {
            bool: {
              filter: [{ term: { status: 'ACTIVE' } }],
            },
          },
          sort: [{ createdAt: { order: 'desc' } }],
          size: limit,
        },
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'product' as const,
        data: { id: hit._id, ...hit._source },
        reason: 'Recently Added',
      }));
    } catch (err) {
      this.logger.warn(`Failed to get recent products: ${(err as Error).message}`);
      return [];
    }
  }

  private async getVerifiedCompanies(
    limit: number,
    latitude?: number,
    longitude?: number,
  ): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const filter: Record<string, unknown>[] = [
        { terms: { status: ['ACTIVE', 'VERIFIED'] } },
        { range: { trustScore: { gte: 70 } } },
      ];

      const body: Record<string, unknown> = {
        query: { bool: { filter } },
        sort: [{ verificationLevel: { order: 'desc' } }, { trustScore: { order: 'desc' } }],
        size: limit,
      };

      if (latitude !== undefined && longitude !== undefined) {
        filter.push(
          this.geoSearchService.buildGeoDistanceFilter({
            lat: latitude,
            lon: longitude,
            radiusKm: 100,
          }),
        );
        (body as any).sort = [
          ...this.geoSearchService.buildGeoDistanceSort(latitude, longitude),
          { verificationLevel: { order: 'desc' } },
          { trustScore: { order: 'desc' } },
        ];
      }

      const response = await openSearchClient.search({
        index: COMPANIES_INDEX,
        body,
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'company' as const,
        data: { id: hit._id, ...hit._source },
        reason: 'Verified Business',
      }));
    } catch (err) {
      this.logger.warn(`Failed to get verified companies: ${(err as Error).message}`);
      return [];
    }
  }

  private async getPopularCategories(limit: number): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const response = await openSearchClient.search({
        index: CATEGORIES_INDEX,
        body: {
          query: {
            bool: {
              filter: [{ term: { isActive: true } }],
            },
          },
          sort: [{ productCount: { order: 'desc' } }, { sortOrder: { order: 'asc' } }],
          size: limit,
        },
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'category' as const,
        data: { id: hit._id, ...hit._source },
        reason: 'Popular Category',
      }));
    } catch (err) {
      this.logger.warn(`Failed to get popular categories: ${(err as Error).message}`);
      return [];
    }
  }

  private async getDealsAndOffers(limit: number): Promise<DiscoveryFeedItem[]> {
    try {
      const openSearchClient = (this.searchService as any).client;
      const response = await openSearchClient.search({
        index: PRODUCTS_INDEX,
        body: {
          query: {
            bool: {
              filter: [
                { term: { status: 'ACTIVE' } },
                { term: { isFeatured: true } },
                { range: { trustScoreSnapshot: { gte: 60 } } },
              ],
            },
          },
          sort: [{ trustScoreSnapshot: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
          size: limit,
        },
      });

      return (response.body.hits.hits || []).map((hit: any) => ({
        type: 'deal' as const,
        data: { id: hit._id, ...hit._source },
        reason: 'Deals & Offers',
        dealType: 'featured' as const,
      }));
    } catch (err) {
      this.logger.warn(`Failed to get deals and offers: ${(err as Error).message}`);
      return [];
    }
  }

  invalidateCache(page: number, limit: number): string {
    return this.buildCacheKey(page, limit, undefined, undefined);
  }

  private buildCacheKey(
    page: number,
    limit: number,
    latitude?: number,
    longitude?: number,
  ): string {
    const geo = latitude !== undefined ? `:${latitude.toFixed(4)}:${longitude?.toFixed(4)}` : '';
    return `tradfind:discover:${page}:${limit}${geo}`;
  }
}
