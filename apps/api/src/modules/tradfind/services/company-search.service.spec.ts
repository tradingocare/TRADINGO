import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../search/search.service';
import { GeoSearchService } from './geo-search.service';
import { SearchRankingService } from './search-ranking.service';
import { CompanySearchService } from './company-search.service';
import { SearchSort } from '../enums/search.enums';

const mockOpenSearchClient = { search: jest.fn() };

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockOpenSearchClient),
}));

describe('CompanySearchService', () => {
  let service: CompanySearchService;
  let geoSearchService: GeoSearchService;
  let rankingService: SearchRankingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanySearchService,
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

    service = module.get<CompanySearchService>(CompanySearchService);
    geoSearchService = module.get<GeoSearchService>(GeoSearchService);
    rankingService = module.get<SearchRankingService>(SearchRankingService);
  });

  describe('searchCompanies', () => {
    it('should return results from OpenSearch', async () => {
      const mockHit = {
        _id: 'c1',
        _score: 0.92,
        _source: {
          name: 'Test Company',
          trustScore: 85,
          verificationLevel: 'LEVEL_4',
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
      expect(result.hits[0].id).toBe('c1');
      expect(result.hits[0]._ranking).toBeDefined();
    });

    it('should search with geo filters', async () => {
      const buildGeoDistanceFilterSpy = jest.spyOn(geoSearchService, 'buildGeoDistanceFilter');
      const buildGeoDistanceSortSpy = jest.spyOn(geoSearchService, 'buildGeoDistanceSort');

      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        latitude: 19.076,
        longitude: 72.8777,
        radius: 50,
        page: 1,
        limit: 20,
      });

      expect(buildGeoDistanceFilterSpy).toHaveBeenCalledWith({
        lat: 19.076,
        lon: 72.8777,
        radiusKm: 50,
      });
      expect(buildGeoDistanceSortSpy).toHaveBeenCalledWith(19.076, 72.8777);
    });

    it('should search with industries filter', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        industryId: 'ind1',
        businessType: 'manufacturer',
        page: 1,
        limit: 20,
      });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([
          { term: { businessType: 'manufacturer' } },
          { term: { industryIds: 'ind1' } },
          { terms: { status: ['ACTIVE', 'VERIFIED'] } },
        ]),
      );
    });

    it('should search with verification level filter', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({
        q: 'test',
        verificationLevel: 'LEVEL_4',
        page: 1,
        limit: 20,
      });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([{ term: { verificationLevel: 'LEVEL_4' } }]),
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
        _id: 'c1',
        _score: 0.78,
        _source: {
          name: 'Test Company',
          trustScore: 90,
          verificationLevel: 'LEVEL_5',
          createdAt: new Date().toISOString(),
        },
      };
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [mockHit], total: { value: 1 } } },
      });

      await service.search({ q: 'test', radius: 50, page: 1, limit: 20 });

      expect(calculateScoreSpy).toHaveBeenCalled();
      expect(calculateScoreSpy.mock.calls[0][0].relevanceScore).toBe(0.78);
    });

    it('should apply minTrustScore filter', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({ q: 'test', minTrustScore: 50, page: 1, limit: 20 });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([{ range: { trustScore: { gte: 50 } } }]),
      );
    });

    it('should filter by city and state', async () => {
      mockOpenSearchClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search({ q: 'test', city: 'Mumbai', state: 'MH', page: 1, limit: 20 });

      const searchCall = mockOpenSearchClient.search.mock.calls[0][0];
      const filters = searchCall.body.query.bool.filter;
      expect(filters).toEqual(
        expect.arrayContaining([
          { term: { city: 'Mumbai' } },
          { term: { state: 'MH' } },
        ]),
      );
    });

    it('should handle total as raw number from OpenSearch', async () => {
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

    it('should build DISTANCE sort with geo', () => {
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
        { trustScore: { order: 'desc' } },
        { _score: { order: 'desc' } },
      ]);
    });

    it('should build VERIFICATION sort', () => {
      const sort = (service as any).buildSort({ sort: SearchSort.VERIFICATION }, false);
      expect(sort).toEqual([
        { verificationLevel: { order: 'desc' } },
        { trustScore: { order: 'desc' } },
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

    it('should use RELEVANCE as default sort', () => {
      const sort = (service as any).buildSort({}, false);
      expect(sort).toEqual([{ _score: { order: 'desc' } }]);
    });
  });
});
