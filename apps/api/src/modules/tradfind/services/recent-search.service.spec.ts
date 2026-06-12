import { Test, TestingModule } from '@nestjs/testing';
import { RecentSearchService } from './recent-search.service';
import { RedisService } from '../../../common/services/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('RecentSearchService', () => {
  let service: RecentSearchService;
  let redisService: jest.Mocked<RedisService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
  };

  const mockPrisma = {
    recentSearch: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecentSearchService,
        { provide: RedisService, useValue: mockRedis },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecentSearchService>(RecentSearchService);
    redisService = module.get(RedisService);
    prismaService = module.get(PrismaService);
  });

  describe('getRecentSearches', () => {
    it('should return cached results from Redis', async () => {
      const cached = JSON.stringify([
        { id: '1', query: 'test', userId: 'u1', timestamp: new Date().toISOString() },
      ]);
      mockRedis.get.mockResolvedValue(cached);

      const results = await service.getRecentSearches('u1', 10);
      expect(results).toHaveLength(1);
      expect(results[0].query).toBe('test');
      expect(mockPrisma.recentSearch.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from Prisma when Redis cache is empty', async () => {
      mockRedis.get.mockResolvedValue(null);
      const dbResults = [
        { id: '1', query: 'test', userId: 'u1', timestamp: new Date(), createdAt: new Date() },
      ];
      mockPrisma.recentSearch.findMany.mockResolvedValue(dbResults);

      const results = await service.getRecentSearches('u1', 10);
      expect(results).toHaveLength(1);
      expect(results[0].query).toBe('test');
      expect(mockPrisma.recentSearch.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
    });

    it('should cache results after DB fetch', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.recentSearch.findMany.mockResolvedValue([]);

      await service.getRecentSearches('u1', 10);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      mockPrisma.recentSearch.findMany.mockRejectedValue(new Error('DB down'));

      const results = await service.getRecentSearches('u1', 10);
      expect(results).toEqual([]);
    });
  });

  describe('addSearch', () => {
    it('should add search to cache and DB', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.recentSearch.create.mockResolvedValue({
        id: 'new', userId: 'u1', query: 'test', timestamp: new Date(), createdAt: new Date(),
      });

      await service.addSearch('u1', 'test');
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockPrisma.recentSearch.create).toHaveBeenCalledWith({
        data: { userId: 'u1', query: 'test', timestamp: expect.any(Date) },
      });
    });

    it('should handle DB failure gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.recentSearch.create.mockRejectedValue(new Error('DB error'));

      await expect(service.addSearch('u1', 'test')).resolves.toBeUndefined();
    });
  });

  describe('deleteSearch', () => {
    it('should delete by id and clear cache', async () => {
      await service.deleteSearch('u1', 'search1');
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockPrisma.recentSearch.deleteMany).toHaveBeenCalledWith({
        where: { id: 'search1', userId: 'u1' },
      });
    });

    it('should delete all for user when no id', async () => {
      await service.deleteSearch('u1');
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockPrisma.recentSearch.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.deleteSearch('u1')).resolves.toBeUndefined();
    });
  });
});
