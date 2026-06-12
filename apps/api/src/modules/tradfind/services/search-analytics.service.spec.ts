import { Test, TestingModule } from '@nestjs/testing';
import { SearchAnalyticsService } from './search-analytics.service';
import { ConfigService } from '@nestjs/config';
import { SearchEntity } from '../enums/search.enums';

const mockInsert = jest.fn();
const mockQuery = jest.fn();
const mockClose = jest.fn();

jest.mock('@clickhouse/client', () => ({
  createClient: jest.fn(() => ({
    insert: mockInsert,
    query: mockQuery,
    close: mockClose,
  })),
}));

describe('SearchAnalyticsService', () => {
  let service: SearchAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAnalyticsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'clickhouse.url': 'http://localhost:8123',
                'clickhouse.username': 'default',
                'clickhouse.password': '',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    service = module.get<SearchAnalyticsService>(SearchAnalyticsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('trackSearch', () => {
    it('should insert search event into ClickHouse', async () => {
      mockInsert.mockResolvedValue(undefined);

      await service.trackSearch({
        userId: 'u1',
        query: 'test product',
        entityType: SearchEntity.PRODUCTS,
        resultCount: 5,
        timestamp: new Date(),
      });

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert.mock.calls[0][0].table).toBe('search_analytics');
      const values = mockInsert.mock.calls[0][0].values;
      expect(values[0].user_id).toBe('u1');
      expect(values[0].query).toBe('test product');
      expect(values[0].entity_type).toBe('products');
      expect(values[0].result_count).toBe(5);
    });

    it('should handle optional fields', async () => {
      mockInsert.mockResolvedValue(undefined);

      await service.trackSearch({
        userId: 'u1',
        query: 'test',
        entityType: SearchEntity.COMPANIES,
        resultCount: 10,
        sessionId: 'sess1',
        clickedResultId: 'c1',
        clickedResultType: 'company',
        latitude: 19.076,
        longitude: 72.877,
        timestamp: new Date(),
      });

      expect(mockInsert.mock.calls[0][0].values[0].session_id).toBe('sess1');
      expect(mockInsert.mock.calls[0][0].values[0].clicked_result_id).toBe('c1');
      expect(mockInsert.mock.calls[0][0].values[0].latitude).toBe(19.076);
    });

    it('should handle insert errors gracefully', async () => {
      mockInsert.mockRejectedValue(new Error('ClickHouse unavailable'));

      await expect(
        service.trackSearch({
          query: 'test',
          resultCount: 0,
          timestamp: new Date(),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('trackClick', () => {
    it('should call trackSearch with click data', async () => {
      mockInsert.mockResolvedValue(undefined);
      const trackSpy = jest.spyOn(service, 'trackSearch');

      await service.trackClick('test query', 'result-1', 'company', 'u1');
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query',
          clickedResultId: 'result-1',
          clickedResultType: 'company',
          userId: 'u1',
        }),
      );
    });
  });

  describe('getPopularQueries', () => {
    it('should return popular queries from ClickHouse', async () => {
      const mockResult = {
        json: jest.fn().mockResolvedValue([
          { query: 'mumbai traders', count: 100 },
          { query: 'electronics', count: 50 },
        ]),
      };
      mockQuery.mockResolvedValue(mockResult);

      const result = await service.getPopularQueries(10);
      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('mumbai traders');
      expect(result[1].count).toBe(50);
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      const result = await service.getPopularQueries(10);
      expect(result).toEqual([]);
    });
  });

  describe('getSearchAnalyticsSummary', () => {
    it('should return aggregated summary', async () => {
      const summaryResult = {
        json: jest.fn().mockResolvedValue([
          { total_searches: 1000, unique_queries: 200, avg_results: 15 },
        ]),
      };

      const topResult = {
        json: jest.fn().mockResolvedValue([
          { query: 'test', count: 50 },
        ]),
      };

      mockQuery.mockResolvedValueOnce(summaryResult).mockResolvedValueOnce(topResult);

      const result = await service.getSearchAnalyticsSummary();
      expect(result.totalSearches).toBe(1000);
      expect(result.uniqueQueries).toBe(200);
      expect(result.avgResultsPerSearch).toBe(15);
      expect(result.topQueries).toHaveLength(1);
    });

    it('should return empty summary on error', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      const result = await service.getSearchAnalyticsSummary();
      expect(result.totalSearches).toBe(0);
      expect(result.topQueries).toEqual([]);
    });
  });
});
