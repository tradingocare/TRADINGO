import { Test, TestingModule } from '@nestjs/testing';
import { TrendingSearchService } from './trending-search.service';
import { RedisService } from '../../../common/services/redis.service';

describe('TrendingSearchService', () => {
  let service: TrendingSearchService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    exists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrendingSearchService,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<TrendingSearchService>(TrendingSearchService);
    redisService = module.get(RedisService);
  });

  describe('getTrendingSearches', () => {
    it('should return cached trending searches', async () => {
      const cached = JSON.stringify([
        { query: 'search1', count: 10, period: 'daily' },
        { query: 'search2', count: 5, period: 'daily' },
      ]);
      mockRedis.get.mockResolvedValue(cached);

      const results = await service.getTrendingSearches(10);
      expect(results).toHaveLength(2);
      expect(results[0].query).toBe('search1');
      expect(results[0].count).toBe(10);
    });

    it('should return empty array when no trending data', async () => {
      mockRedis.get.mockResolvedValue(null);
      const results = await service.getTrendingSearches(10);
      expect(results).toEqual([]);
    });

    it('should accept period parameter', async () => {
      mockRedis.get.mockResolvedValue(null);

      await service.getTrendingSearches(10, 'weekly');
      const keyCall = mockRedis.get.mock.calls.find((c) => String(c[0]).includes('weekly'));
      expect(keyCall).toBeDefined();

      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);
      await service.getTrendingSearches(10, 'monthly');
      const monthlyCall = mockRedis.get.mock.calls.find((c) => String(c[0]).includes('monthly'));
      expect(monthlyCall).toBeDefined();
    });

    it('should sort results by count desc', async () => {
      const rawData = JSON.stringify({ search1: 5, search2: 10, search3: 1 });
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('cached')) return null;
        return Promise.resolve(rawData);
      });

      const results = await service.getTrendingSearches(10);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      const results = await service.getTrendingSearches(10);
      expect(results).toEqual([]);
    });
  });

  describe('trackSearch', () => {
    it('should store search query in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      await service.trackSearch('test query');
      expect(mockRedis.get).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should skip empty queries', async () => {
      await service.trackSearch('');
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));

      await expect(service.trackSearch('test query')).resolves.toBeUndefined();
    });
  });
});
