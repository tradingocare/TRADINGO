import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../search/search.service';
import { GeoSearchService } from './geo-search.service';
import { SearchRankingService } from './search-ranking.service';
import { ProductSearchService } from './product-search.service';
import { SearchSort } from '../enums/search.enums';

const mockOpenSearchClient = { search: jest.fn() };

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockOpenSearchClient),
}));

describe('ProductSearchService', () => {
  let service: ProductSearchService;
  let geoSearchService: GeoSearchService;
  let rankingService: SearchRankingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchService,
        GeoSearchService,
        SearchRankingService,
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
      ],
    }).compile();

    service = module.get<ProductSearchService>(ProductSearchService);
    geoSearchService = module.get<GeoSearchService>(GeoSearchService);
    rankingService = module.get<SearchRankingService>(SearchRankingService);
  });

  describe('searchProducts', () => {
    it('should return results from OpenSearch', async () => {
      const mockHit = {
        _id: 'p1',
        _score: 0.95,
        _source: {
          name: 'Test Product',
          trustScoreSnapshot: 80,
          verificationLevel: 'LEVEL_3',
          createdAt: new Date().toISOString(),
        },
      };
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [mockHit], total: { value: 1 } } },
      });

      const result = await service.search({ q: 'test', page: 1, limit: 20 });

      expect(result.hits).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.hits[0].id).toBe('p1');
      expect(result.hits[0]._ranking).toBeDefined();
    });

    it('should search with geo filters (radius, lat/lon)', async () => {
      const buildGeoDistanceFilterSpy = jest.spyOn(geoSearchService, 'buildGeoDistanceFilter');
      const buildGeoDistanceSortSpy = jest.spyOn(geoSearchService, 'buildGeoDistanceSort');

      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        latitude: 19.076,
        longitude: 72.8777,
        radius: 25,
        page: 1,
        limit: 20,
      });

      expect(buildGeoDistanceFilterSpy).toHaveBeenCalledWith({
        lat: 19.076,
        lon: 72.8777,
        radiusKm: 25,
      });
      expect(buildGeoDistanceSortSpy).toHaveBeenCalledWith(19.076, 72.8777);
    });

    it('should search with categories filter', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        categoryId: 'cat1',
        industryId: 'ind1',
        productType: 'finished',
        page: 1,
        limit: 20,
      });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([
          { term: { categoryId: 'cat1' } },
          { term: { industryId: 'ind1' } },
          { term: { productType: 'finished' } },
          { term: { status: 'ACTIVE' } },
        ]),
      );
    });

    it('should return empty results when search fails', async () => {
      mockOpenSearchClient.search.mockRejectedValue(new Error('OpenSearch unavailable'));

      const result = await service.search({ q: 'test', page: 1, limit: 20 });

      expect(result.hits).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should include ranking score in each hit', async () => {
      const calculateScoreSpy = jest.spyOn(rankingService, 'calculateScore');
      const mockHit = {
        _id: 'p1',
        _score: 0.85,
        _source: {
          name: 'Test Product',
          trustScoreSnapshot: 75,
          verificationLevel: 'LEVEL_4',
          createdAt: new Date().toISOString(),
        },
      };
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [mockHit], total: { value: 1 } } },
      });

      await service.search({ q: 'test', radius: 50, page: 1, limit: 20 });

      expect(calculateScoreSpy).toHaveBeenCalled();
      expect(calculateScoreSpy.mock.calls[0][0].relevanceScore).toBe(0.85);
    });

    it('should apply price range filters', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        minPrice: 100,
        maxPrice: 500,
        moq: 10,
        page: 1,
        limit: 20,
      });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([
          { range: { minPrice: { gte: 100 } } },
          { range: { maxPrice: { lte: 500 } } },
          { range: { moq: { lte: 10 } } },
        ]),
      );
    });

    it('should handle total as number type from OpenSearch', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: 0 } },
      });

      const result = await service.search({ q: 'test', page: 1, limit: 20 });
      expect(result.total).toBe(0);
    });
  });

  describe('buildSort', () => {
    it('should build RELEVANCE sort without geo', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.RELEVANCE }, false);
      expect(sort).toEqual([{ _score: { order: 'desc' } }]);
    });

    it('should build RELEVANCE sort with geo', () => {
      const sort = (service as any).buildSort(
        { sort: SearchSort.RELEVANCE, latitude: 19.076, longitude: 72.8777 },
        true,
      );
      expect(sort).toHaveLength(2);
      expect(sort[0]).toHaveProperty('_geo_distance');
      expect(sort[1]).toEqual({ _score: { order: 'desc' } });
    });

    it('should build DISTANCE sort', () => {
      const sort = (service as any).buildSort(
        { sort: SearchSort.DISTANCE, latitude: 19.076, longitude: 72.8777 },
        true,
      );
      expect(sort).toHaveLength(2);
      expect(sort[0]).toHaveProperty('_geo_distance');
      expect(sort[1]).toEqual({ _score: { order: 'desc' } });
    });

    it('should build DISTANCE sort without geo falling back to score', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.DISTANCE }, false);
      expect(sort).toEqual([{ _score: { order: 'desc' } }]);
    });

    it('should build TRUST_SCORE sort', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.TRUST_SCORE }, false);
      expect(sort).toEqual([
        { trustScoreSnapshot: { order: 'desc' } },
        { _score: { order: 'desc' } },
      ]);
    });

    it('should build LATEST sort', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.LATEST }, false);
      expect(sort).toEqual([
        { createdAt: { order: 'desc' } },
        { _score: { order: 'desc' } },
      ]);
    });

    it('should build POPULARITY sort', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.POPULARITY }, false);
      expect(sort).toEqual([
        { isFeatured: { order: 'desc' } },
        { trustScoreSnapshot: { order: 'desc' } },
        { _score: { order: 'desc' } },
      ]);
    });
  });
});
