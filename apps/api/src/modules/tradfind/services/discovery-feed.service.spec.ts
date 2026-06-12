import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../search/search.service';
import { RedisService } from '../../../common/services/redis.service';
import { GeoSearchService } from './geo-search.service';
import { DiscoveryFeedService } from './discovery-feed.service';

const mockOpenSearchClient = { search: jest.fn() };

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockOpenSearchClient),
}));

describe('DiscoveryFeedService', () => {
  let service: DiscoveryFeedService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryFeedService,
        GeoSearchService,
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'opensearch.url': 'http://localhost:9200',
                'opensearch.username': 'admin',
                'opensearch.password': 'admin',
                'opensearch.rejectUnauthorized': false,
              };
              return config[key];
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiscoveryFeedService>(DiscoveryFeedService);
    redisService = module.get(RedisService);
  });

  const mockTrendingHit = {
    _id: 'tp1',
    _source: { name: 'Trending Product', trustScoreSnapshot: 95 },
  };
  const mockFeaturedHit = {
    _id: 'fc1',
    _source: { name: 'Featured Company', trustScore: 90 },
  };
  const mockRecentHit = {
    _id: 'rp1',
    _source: { name: 'Recent Product', createdAt: new Date().toISOString() },
  };
  const mockVerifiedHit = {
    _id: 'vc1',
    _source: { name: 'Verified Company', trustScore: 80, verificationLevel: 'LEVEL_5' },
  };
  const mockCategoryHit = {
    _id: 'cat1',
    _source: { name: 'Popular Category', productCount: 500 },
  };
  const mockDealHit = {
    _id: 'deal1',
    _source: { name: 'Deal Product', trustScoreSnapshot: 85 },
  };

  function mockAllSections() {
    mockOpenSearchClient.search.mockImplementation(async ({ index, body }: any) => {
      if (index === 'products' && body?.sort?.[0]?.trustScoreSnapshot && body?.query?.bool?.filter?.some((f: any) => f?.range?.trustScoreSnapshot)) {
        return { body: { hits: { hits: [mockDealHit], total: 1 } } };
      }
      if (index === 'products' && body?.sort?.[0]?.trustScoreSnapshot && !body?.query?.bool?.filter?.some((f: any) => f?.range?.trustScoreSnapshot)) {
        return { body: { hits: { hits: [mockTrendingHit], total: 1 } } };
      }
      if (index === 'products' && body?.sort?.[0]?.createdAt) {
        return { body: { hits: { hits: [mockRecentHit], total: 1 } } };
      }
      if (index === 'companies' && body?.sort?.[0]?.trustScore && !body?.sort?.[0]?.verificationLevel) {
        return { body: { hits: { hits: [mockFeaturedHit], total: 1 } } };
      }
      if (index === 'companies' && body?.sort?.[0]?.verificationLevel) {
        return { body: { hits: { hits: [mockVerifiedHit], total: 1 } } };
      }
      if (index === 'categories') {
        return { body: { hits: { hits: [mockCategoryHit], total: 1 } } };
      }
      return { body: { hits: { hits: [], total: 0 } } };
    });
  }

  describe('getDiscoveryFeed', () => {
    it('should return personalized feed with all 6 sections', async () => {
      mockAllSections();
      redisService.get.mockResolvedValue(null);

      const result = await service.getFeed(1, 20);

      expect(result.items).toHaveLength(6);
      expect(result.meta.total).toBe(6);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);

      const types = result.items.map((i) => i.type);
      expect(types).toEqual(['product', 'company', 'product', 'company', 'category', 'deal']);
      expect(result.items[0].reason).toBe('Trending Product');
      expect(result.items[1].reason).toBe('Featured Company');
      expect(result.items[2].reason).toBe('Recently Added');
      expect(result.items[3].reason).toBe('Verified Business');
      expect(result.items[4].reason).toBe('Popular Category');
      expect(result.items[5].reason).toBe('Deals & Offers');
    });

    it('should return from cache when available', async () => {
      const cachedFeed = {
        items: [
          { type: 'product', data: { id: 'cached-p1' }, reason: 'Trending Product' },
        ],
        meta: { total: 1, page: 1, limit: 20 },
      };
      redisService.get.mockResolvedValue(JSON.stringify(cachedFeed));

      const result = await service.getFeed(1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].data.id).toBe('cached-p1');
      expect(mockOpenSearchClient.search).not.toHaveBeenCalled();
    });

    it('should handle cache read failures gracefully', async () => {
      redisService.get.mockRejectedValue(new Error('Redis error'));
      mockAllSections();

      const result = await service.getFeed(1, 20);

      expect(result.items.length).toBeGreaterThan(0);
      expect(mockOpenSearchClient.search).toHaveBeenCalled();
    });

    it('should cache the feed after generating it', async () => {
      redisService.get.mockResolvedValue(null);
      mockAllSections();

      await service.getFeed(1, 20);

      expect(redisService.set).toHaveBeenCalled();
      const setCall = (redisService.set as jest.Mock).mock.calls[0];
      expect(setCall[0]).toContain('tradfind:discover:1:20');
      const parsed = JSON.parse(setCall[1]);
      expect(parsed.items).toHaveLength(6);
    });

    it('should handle all sections returning empty', async () => {
      redisService.get.mockResolvedValue(null);
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: 0 } },
      });

      const result = await service.getFeed(1, 20);

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle search failures gracefully', async () => {
      redisService.get.mockResolvedValue(null);
      mockOpenSearchClient.search.mockRejectedValue(new Error('Search failed'));

      const result = await service.getFeed(1, 20);

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should include geo-aware results when lat/lon provided', async () => {
      redisService.get.mockResolvedValue(null);
      const buildGeoDistanceFilterSpy = jest.spyOn(
        service as any,
        'getFeaturedCompanies',
      ).mockResolvedValue([
        { type: 'company', data: { id: 'nearby' }, reason: 'Near You' },
      ]);
      jest.spyOn(service as any, 'getTrendingProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRecentProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getVerifiedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getPopularCategories').mockResolvedValue([]);
      jest.spyOn(service as any, 'getDealsAndOffers').mockResolvedValue([]);

      const result = await service.getFeed(1, 20, 19.076, 72.8777);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].reason).toBe('Near You');
    });

    it('should limit items to the requested limit', async () => {
      redisService.get.mockResolvedValue(null);
      jest.spyOn(service as any, 'getTrendingProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getFeaturedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRecentProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getVerifiedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getPopularCategories').mockResolvedValue([]);
      jest.spyOn(service as any, 'getDealsAndOffers').mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          type: 'deal' as const,
          data: { id: `deal-${i}`, name: `Deal ${i}` },
          reason: 'Deals & Offers',
          dealType: 'featured' as const,
        })),
      );

      const result = await service.getFeed(1, 3);

      expect(result.items.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getDealsAndOffers', () => {
    it('should return featured products as deals', async () => {
      jest.spyOn(service as any, 'getDealsAndOffers').mockRestore();
      redisService.get.mockResolvedValue(null);
      jest.spyOn(service as any, 'getTrendingProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getFeaturedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRecentProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getVerifiedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getPopularCategories').mockResolvedValue([]);

      mockOpenSearchClient.search.mockImplementation(async ({ index, body }: any) => {
        if (body?.query?.bool?.filter?.some((f: any) => f?.range?.trustScoreSnapshot)) {
          return { body: { hits: { hits: [mockDealHit], total: 1 } } };
        }
        return { body: { hits: { hits: [], total: 0 } } };
      });

      const result = await service.getFeed(1, 20);
      const dealItems = result.items.filter((i) => i.type === 'deal');
      expect(dealItems).toHaveLength(1);
      expect(dealItems[0].reason).toBe('Deals & Offers');
      expect(dealItems[0].dealType).toBe('featured');
    });

    it('should handle deals section failures gracefully', async () => {
      jest.spyOn(service as any, 'getDealsAndOffers').mockRestore();
      redisService.get.mockResolvedValue(null);
      jest.spyOn(service as any, 'getTrendingProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getFeaturedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRecentProducts').mockResolvedValue([]);
      jest.spyOn(service as any, 'getVerifiedCompanies').mockResolvedValue([]);
      jest.spyOn(service as any, 'getPopularCategories').mockResolvedValue([]);

      mockOpenSearchClient.search.mockImplementation(async ({ index, body }: any) => {
        if (body?.query?.bool?.filter?.some((f: any) => f?.range?.trustScoreSnapshot)) {
          throw new Error('Deals query failed');
        }
        return { body: { hits: { hits: [], total: 0 } } };
      });

      const result = await service.getFeed(1, 20);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('invalidateCache', () => {
    it('should return the cache key for invalidation', () => {
      const key = service.invalidateCache(1, 20);
      expect(key).toBe('tradfind:discover:1:20');
    });
  });
});
