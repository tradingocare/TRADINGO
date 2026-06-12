import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../search/search.service';
import { TradfindService } from './tradfind.service';
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
import { SearchEntity } from './enums/search.enums';

describe('TradfindService', () => {
  let service: TradfindService;
  let searchService: jest.Mocked<SearchService>;
  let productSearchService: jest.Mocked<ProductSearchService>;
  let companySearchService: jest.Mocked<CompanySearchService>;
  let autocompleteService: jest.Mocked<AutocompleteService>;
  let suggestionsService: jest.Mocked<SuggestionsService>;
  let recentSearchService: jest.Mocked<RecentSearchService>;
  let trendingSearchService: jest.Mocked<TrendingSearchService>;
  let discoveryFeedService: jest.Mocked<DiscoveryFeedService>;
  let searchAnalyticsService: jest.Mocked<SearchAnalyticsService>;

  const mockSearchResult = (overrides = {}) => ({
    hits: [],
    total: 0,
    page: 1,
    limit: 10,
    ...overrides,
  });

  beforeEach(async () => {
    const mockSearchService = {
      search: jest.fn(),
      client: { search: jest.fn() },
    };

    const mockProductSearch = { search: jest.fn() };
    const mockCompanySearch = { search: jest.fn() };
    const mockGeoSearch = {};
    const mockRanking = {};
    const mockAutocomplete = { autocomplete: jest.fn() };
    const mockSuggestions = { getSuggestions: jest.fn() };
    const mockRecentSearch = {
      getRecentSearches: jest.fn(),
      deleteSearch: jest.fn(),
    };
    const mockTrendingSearch = {
      trackSearch: jest.fn(),
      getTrendingSearches: jest.fn(),
    };
    const mockDiscoveryFeed = { getFeed: jest.fn() };
    const mockSearchAnalytics = { trackSearch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradfindService,
        { provide: SearchService, useValue: mockSearchService },
        { provide: ProductSearchService, useValue: mockProductSearch },
        { provide: CompanySearchService, useValue: mockCompanySearch },
        { provide: GeoSearchService, useValue: mockGeoSearch },
        { provide: SearchRankingService, useValue: mockRanking },
        { provide: AutocompleteService, useValue: mockAutocomplete },
        { provide: SuggestionsService, useValue: mockSuggestions },
        { provide: RecentSearchService, useValue: mockRecentSearch },
        { provide: TrendingSearchService, useValue: mockTrendingSearch },
        { provide: DiscoveryFeedService, useValue: mockDiscoveryFeed },
        { provide: SearchAnalyticsService, useValue: mockSearchAnalytics },
      ],
    }).compile();

    service = module.get<TradfindService>(TradfindService);
    searchService = module.get(SearchService);
    productSearchService = module.get(ProductSearchService);
    companySearchService = module.get(CompanySearchService);
    autocompleteService = module.get(AutocompleteService);
    suggestionsService = module.get(SuggestionsService);
    recentSearchService = module.get(RecentSearchService);
    trendingSearchService = module.get(TrendingSearchService);
    discoveryFeedService = module.get(DiscoveryFeedService);
    searchAnalyticsService = module.get(SearchAnalyticsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('globalSearch', () => {
    it('should orchestrate search across all indices', async () => {
      searchService.search
        .mockResolvedValueOnce(mockSearchResult({ hits: [{ id: 'p1' }], total: 1 }))
        .mockResolvedValueOnce(mockSearchResult())
        .mockResolvedValueOnce(mockSearchResult())
        .mockResolvedValueOnce(mockSearchResult());
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.globalSearch({ q: 'test', page: 1, limit: 10 });

      expect(searchService.search).toHaveBeenCalledTimes(4);
      expect(result.products).toHaveLength(1);
      expect(result.companies).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.industries).toEqual([]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should return combined results from all types', async () => {
      searchService.search.mockImplementation(async (index: string) => {
        const map: Record<string, any> = {
          products: { hits: [{ id: 'p1', name: 'Product' }], total: 1 },
          companies: { hits: [{ id: 'c1', name: 'Company' }], total: 1 },
          categories: { hits: [{ id: 'cat1', name: 'Category' }], total: 1 },
          industries: { hits: [{ id: 'ind1', name: 'Industry' }], total: 1 },
        };
        return map[index] || { hits: [], total: 0, page: 1, limit: 10 };
      });
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.globalSearch({ q: 'test', page: 1, limit: 10 });

      expect(result.products).toHaveLength(1);
      expect(result.companies).toHaveLength(1);
      expect(result.categories).toHaveLength(1);
      expect(result.industries).toHaveLength(1);
      expect(result.meta.total).toBe(4);
    });

    it('should return empty results when no matches', async () => {
      searchService.search.mockResolvedValue(mockSearchResult());
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.globalSearch({ q: 'nonexistent', page: 1, limit: 10 });

      expect(result.products).toEqual([]);
      expect(result.companies).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle search failures in individual indices gracefully', async () => {
      searchService.search
        .mockResolvedValueOnce(mockSearchResult({ hits: [{ id: 'p1' }], total: 1 }))
        .mockRejectedValueOnce(new Error('Search failed'))
        .mockResolvedValueOnce(mockSearchResult())
        .mockResolvedValueOnce(mockSearchResult());
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.globalSearch({ q: 'test', page: 1, limit: 10 });

      expect(result.products).toHaveLength(1);
      expect(result.companies).toEqual([]);
      expect(result.meta.total).toBe(1);
    });

    it('should track search and analytics', async () => {
      searchService.search
        .mockResolvedValueOnce(mockSearchResult({ total: 3 }))
        .mockResolvedValueOnce(mockSearchResult({ total: 0 }))
        .mockResolvedValueOnce(mockSearchResult({ total: 0 }))
        .mockResolvedValueOnce(mockSearchResult({ total: 0 }));
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      await service.globalSearch({ q: 'test', latitude: 19.076, longitude: 72.8777, page: 1, limit: 10 });

      expect(trendingSearchService.trackSearch).toHaveBeenCalledWith('test');
      expect(searchAnalyticsService.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          entityType: SearchEntity.PRODUCTS,
          resultCount: 3,
          latitude: 19.076,
          longitude: 72.8777,
        }),
      );
    });
  });

  describe('searchProducts', () => {
    it('should delegate to ProductSearchService', async () => {
      const expected = { hits: [{ id: 'p1' }], total: 1, page: 1, limit: 20 };
      productSearchService.search.mockResolvedValue(expected);
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.productSearch({ q: 'test', page: 1, limit: 20 });

      expect(productSearchService.search).toHaveBeenCalledWith({ q: 'test', page: 1, limit: 20 });
      expect(result).toEqual(expected);
    });

    it('should track search and analytics on product search', async () => {
      productSearchService.search.mockResolvedValue({ hits: [], total: 5, page: 1, limit: 20 });
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      await service.productSearch({ q: 'test', page: 1, limit: 20 });

      expect(trendingSearchService.trackSearch).toHaveBeenCalledWith('test');
      expect(searchAnalyticsService.trackSearch).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: SearchEntity.PRODUCTS, resultCount: 5 }),
      );
    });
  });

  describe('searchCompanies', () => {
    it('should delegate to CompanySearchService', async () => {
      const expected = { hits: [{ id: 'c1' }], total: 1, page: 1, limit: 20 };
      companySearchService.search.mockResolvedValue(expected);
      trendingSearchService.trackSearch.mockResolvedValue(undefined);

      const result = await service.companySearch({ q: 'test', page: 1, limit: 20 });

      expect(companySearchService.search).toHaveBeenCalledWith({ q: 'test', page: 1, limit: 20 });
      expect(result).toEqual(expected);
    });
  });

  describe('autocomplete', () => {
    it('should delegate to AutocompleteService', async () => {
      const expected = [{ type: SearchEntity.PRODUCTS, id: 'p1', text: 'Test' }];
      autocompleteService.autocomplete.mockResolvedValue(expected);

      const result = await service.autocomplete({ q: 'test', limit: 5 });

      expect(autocompleteService.autocomplete).toHaveBeenCalledWith('test', 5);
      expect(result).toEqual(expected);
    });
  });

  describe('getSuggestions', () => {
    it('should delegate to SuggestionsService', async () => {
      const expected = [{ query: 'trending', count: 10 }];
      suggestionsService.getSuggestions.mockResolvedValue(expected);

      const result = await service.getSuggestions({ limit: 5 });

      expect(suggestionsService.getSuggestions).toHaveBeenCalledWith(5);
      expect(result).toEqual(expected);
    });
  });

  describe('getRecentSearches', () => {
    it('should delegate to RecentSearchService', async () => {
      const expected = [{ userId: 'u1', query: 'test', timestamp: new Date() }];
      recentSearchService.getRecentSearches.mockResolvedValue(expected);

      const result = await service.getRecentSearches('u1', 10);

      expect(recentSearchService.getRecentSearches).toHaveBeenCalledWith('u1', 10);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteRecentSearches', () => {
    it('should delegate to RecentSearchService with searchId', async () => {
      await service.deleteRecentSearches('u1', 's1');
      expect(recentSearchService.deleteSearch).toHaveBeenCalledWith('u1', 's1');
    });

    it('should delegate to RecentSearchService without searchId', async () => {
      await service.deleteRecentSearches('u1');
      expect(recentSearchService.deleteSearch).toHaveBeenCalledWith('u1', undefined);
    });
  });

  describe('getTrendingSearches', () => {
    it('should delegate to TrendingSearchService with defaults', async () => {
      trendingSearchService.getTrendingSearches.mockResolvedValue([]);
      await service.getTrendingSearches();
      expect(trendingSearchService.getTrendingSearches).toHaveBeenCalledWith(10, 'daily');
    });

    it('should delegate with custom params', async () => {
      trendingSearchService.getTrendingSearches.mockResolvedValue([]);
      await service.getTrendingSearches(5, 'weekly');
      expect(trendingSearchService.getTrendingSearches).toHaveBeenCalledWith(5, 'weekly');
    });
  });

  describe('getDiscoveryFeed', () => {
    it('should delegate to DiscoveryFeedService', async () => {
      const expected = {
        items: [{ type: 'product' as const, data: { id: 'p1' }, reason: 'Trending' }],
        meta: { total: 1, page: 1, limit: 20 },
      };
      discoveryFeedService.getFeed.mockResolvedValue(expected);

      const result = await service.getDiscoveryFeed({ page: 1, limit: 20, latitude: 19.076, longitude: 72.8777 });

      expect(discoveryFeedService.getFeed).toHaveBeenCalledWith(1, 20, 19.076, 72.8777);
      expect(result).toEqual(expected);
    });
  });

  describe('private searchInIndex', () => {
    it('should return empty result on search failure', async () => {
      searchService.search.mockRejectedValue(new Error('fail'));

      const result = await (service as any).searchInIndex('products', 'test', { status: 'ACTIVE' }, 1, 10);

      expect(result).toEqual({ hits: [], total: 0, page: 1, limit: 10 });
    });

    it('should skip array values in filters', async () => {
      searchService.search.mockResolvedValue({ hits: [], total: 0, page: 1, limit: 10 });

      await (service as any).searchInIndex('products', 'test', { status: ['ACTIVE', 'VERIFIED'] }, 1, 10);

      expect(searchService.search).toHaveBeenCalledWith(
        'products',
        'test',
        {},
        { page: 1, limit: 10 },
      );
    });
  });
});
