import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../search/search.service';
import { RedisService } from '../../../common/services/redis.service';
import { TrendingSearchService } from './trending-search.service';
import { SuggestionsService } from './suggestions.service';

const mockOpenSearchClient = {
  search: jest.fn(),
};

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockOpenSearchClient),
}));

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let redisService: jest.Mocked<RedisService>;
  let trendingSearchService: jest.Mocked<TrendingSearchService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    exists: jest.fn(),
  };

  const mockTrending = {
    getTrendingSearches: jest.fn(),
    trackSearch: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        SearchService,
        { provide: RedisService, useValue: mockRedis },
        { provide: TrendingSearchService, useValue: mockTrending },
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

    service = module.get<SuggestionsService>(SuggestionsService);
    redisService = module.get(RedisService);
    trendingSearchService = module.get(TrendingSearchService);
  });

  it('should return cached suggestions', async () => {
    const cached = JSON.stringify([
      { query: 'mumbai traders', count: 100 },
      { query: 'electronics', count: 50 },
    ]);
    mockRedis.get.mockResolvedValue(cached);

    const results = await service.getSuggestions(10);
    expect(results).toHaveLength(2);
    expect(results[0].query).toBe('mumbai traders');
  });

  it('should generate suggestions from trending when cache empty', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockTrending.getTrendingSearches.mockResolvedValue([
      { query: 'trending item', count: 200, period: 'daily' },
    ]);

    const results = await service.getSuggestions(10);
    expect(results.length).toBeGreaterThan(0);
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('should handle search failures gracefully', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis down'));
    mockTrending.getTrendingSearches.mockRejectedValue(new Error('Trending down'));

    const results = await service.getSuggestions(10);
    expect(results).toEqual([]);
  });
});
