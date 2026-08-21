import { Test, TestingModule } from '@nestjs/testing';
import { CategoryDemandService } from './category-demand.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { CategoryDemandResult, CategoryDemandScore } from './dto/category-demand.dto';

describe('CategoryDemandService', () => {
  let service: CategoryDemandService;
  let prisma: PrismaService;
  let redis: { getJson: jest.Mock; setJson: jest.Mock };

  beforeEach(async () => {
    redis = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryDemandService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          } as unknown as PrismaService,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<CategoryDemandService>(CategoryDemandService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopCategories', () => {
    it('should return empty data when no active categories exist', async () => {
      jest.spyOn(prisma.category, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(0);

      const result = await service.getTopCategories(20);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ total: 0, limit: 20 });
    });

    it('should return top categories with demand scores', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          icon: 'phone',
          products: [
            { monthlyOrders: 150, viewCount: 2000, savedCount: 150 },
            { monthlyOrders: 80, viewCount: 1200, savedCount: 80 },
          ],
        },
        {
          id: 'cat-2',
          name: 'Home & Garden',
          slug: 'home-garden',
          icon: 'leaf',
          products: [
            { monthlyOrders: 30, viewCount: 500, savedCount: 30 },
            { monthlyOrders: 10, viewCount: 200, savedCount: 10 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(2);

      const result = await service.getTopCategories(10);

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({ total: 2, limit: 10 });

      // Electronics should rank higher due to higher sales/views
      const electronics = result.data.find((c) => c.categoryName === 'Electronics');
      const homeGarden = result.data.find((c) => c.categoryName === 'Home & Garden');

      expect(electronics).toBeDefined();
      expect(homeGarden).toBeDefined();
      expect(electronics!.rank).toBe(1);
      expect(homeGarden!.rank).toBe(2);
      expect(electronics!.totalDemandScore).toBeGreaterThan(homeGarden!.totalDemandScore);

      // Both should have data confidence > 0 since they have products with data
      expect(electronics!.dataConfidence).toBeGreaterThan(0);
      expect(homeGarden!.dataConfidence).toBeGreaterThan(0);
    });

    it('should respect the limit parameter', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          icon: 'phone',
          products: [
            { monthlyOrders: 150, viewCount: 2000, savedCount: 150 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(1);

      const result = await service.getTopCategories(1);

      expect(result.data).toHaveLength(1);
    });

    it('should exclude inactive categories', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Active Cat',
          slug: 'active-cat',
          icon: 'test',
          isActive: true,
          products: [
            { monthlyOrders: 100, viewCount: 500, savedCount: 50 },
          ],
        },
        {
          id: 'cat-2',
          name: 'Inactive Cat',
          slug: 'inactive-cat',
          icon: 'test',
          isActive: false,
          products: [
            { monthlyOrders: 200, viewCount: 1000, savedCount: 100 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(
        mockCategories.filter((c) => c.isActive) as any,
      );
      jest.spyOn(prisma.category, 'count').mockResolvedValue(1);

      const result = await service.getTopCategories(20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].categoryName).toBe('Active Cat');
    });

    it('should handle categories with zero data signals', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'No Data Cat',
          slug: 'no-data-cat',
          icon: 'test',
          products: [
            { monthlyOrders: 0, viewCount: 0, savedCount: 0 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(1);

      const result = await service.getTopCategories(20);

      expect(result.data).toHaveLength(1);
      // Data confidence should be 0 since no signals are populated
      expect(result.data[0].dataConfidence).toBe(0);
      // Rank should still be assigned (1)
      expect(result.data[0].rank).toBe(1);
    });

    it('should sort by totalDemandScore descending', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Low Demand',
          slug: 'low-demand',
          icon: 'a',
          products: [
            { monthlyOrders: 1, viewCount: 1, savedCount: 1 },
          ],
        },
        {
          id: 'cat-2',
          name: 'High Demand',
          slug: 'high-demand',
          icon: 'b',
          products: [
            { monthlyOrders: 1000, viewCount: 5000, savedCount: 500 },
          ],
        },
        {
          id: 'cat-3',
          name: 'Medium Demand',
          slug: 'medium-demand',
          icon: 'c',
          products: [
            { monthlyOrders: 100, viewCount: 500, savedCount: 50 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(3);

      const result = await service.getTopCategories(3);

      // Should be sorted high -> low
      expect(result.data[0].categoryName).toBe('High Demand');
      expect(result.data[1].categoryName).toBe('Medium Demand');
      expect(result.data[2].categoryName).toBe('Low Demand');

      // Ranks should be 1, 2, 3 respectively
      expect(result.data[0].rank).toBe(1);
      expect(result.data[1].rank).toBe(2);
      expect(result.data[2].rank).toBe(3);
    });

    it('should return correct data confidence values', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Full Data',
          slug: 'full-data',
          icon: 'a',
          products: [
            { monthlyOrders: 100, viewCount: 500, savedCount: 50 },
          ],
        },
        {
          id: 'cat-2',
          name: 'Partial Data',
          slug: 'partial-data',
          icon: 'b',
          products: [
            { monthlyOrders: 10, viewCount: 500, savedCount: 0 },
          ],
        },
        {
          id: 'cat-3',
          name: 'No Data',
          slug: 'no-data',
          icon: 'c',
          products: [
            { monthlyOrders: 0, viewCount: 0, savedCount: 0 },
          ],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(3);

      const result = await service.getTopCategories(3);

// Full Data: 3/3 signals (monthlyOrders, viewCount, savedCount) populated = 1.0
      expect(result.data.find((c) => c.categoryName === 'Full Data')!.dataConfidence).toBe(1.0);

      // Partial Data: 2/3 signals populated = 0.67
      expect(result.data.find((c) => c.categoryName === 'Partial Data')!.dataConfidence).toBe(0.67);

      // No Data: 0/3 signals populated = 0.0
      expect(result.data.find((c) => c.categoryName === 'No Data')!.dataConfidence).toBe(0);
    });

    it('should serve from Redis cache when present and slice to requested limit', async () => {
      const cachedResult: CategoryDemandResult = {
        data: [
          {
            categoryId: 'cat-1',
            categoryName: 'Cached Cat',
            slug: 'cached-cat',
            icon: 'c',
            rank: 1,
            totalDemandScore: 90,
            dataConfidence: 1,
            signalBreakdown: { sales: 100, rfq: 100, search: 100, views: 100, engagement: 100, conversion: 40 },
            calculatedAt: new Date(),
          },
        ],
        meta: { total: 5, limit: 20 },
      };
      redis.getJson.mockResolvedValue(cachedResult);
      const findMany = jest.spyOn(prisma.category, 'findMany');

      const result = await service.getTopCategories(1);

      expect(findMany).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].categoryName).toBe('Cached Cat');
      expect(result.meta).toEqual({ total: 5, limit: 1 });
      expect(redis.setJson).not.toHaveBeenCalled();
    });

    it('should compute and write cache when cache is empty', async () => {
      redis.getJson.mockResolvedValue(null);
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          icon: 'phone',
          products: [{ monthlyOrders: 150, viewCount: 2000, savedCount: 150 }],
        },
      ];

      jest.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);
      jest.spyOn(prisma.category, 'count').mockResolvedValue(1);

      const result = await service.getTopCategories(10);

      expect(result.data).toHaveLength(1);
      expect(redis.setJson).toHaveBeenCalledWith(
        'categories:demand:v1',
        expect.objectContaining({ meta: { total: 1, limit: 10 } }),
        300,
      );
    });
  });
});