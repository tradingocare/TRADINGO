import { Test, TestingModule } from '@nestjs/testing';
import { BestsellerService } from '../bestseller.service';
import { BestsellerAnalyticsService } from '../bestseller-analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('BestsellerService', () => {
  let service: BestsellerService;
  let prisma: Record<string, any>;
  let analytics: BestsellerAnalyticsService;

  const mockWeekStart = new Date('2026-06-15T00:00:00.000Z');
  const mockWeekEnd = new Date('2026-06-21T23:59:59.999Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      orderItem: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      order: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
      },
      rfq: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      quote: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      company: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      productBestsellerSnapshot: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      categoryBestsellerSnapshot: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      sellerBestsellerSnapshot: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((cb: any) => (Array.isArray(cb) ? Promise.all(cb) : cb(prisma))),
    };

    analytics = {
      trackCalculationTotal: jest.fn(),
      trackProductsTotal: jest.fn(),
      trackCategoriesTotal: jest.fn(),
      trackSellersTotal: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BestsellerService,
        { provide: PrismaService, useValue: prisma },
        { provide: BestsellerAnalyticsService, useValue: analytics },
      ],
    }).compile();

    service = module.get<BestsellerService>(BestsellerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Bestseller generation', () => {
    it('should generate product bestseller snapshots with correct ranking', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'prod-1', companyId: 'comp-1', categoryId: 'cat-1',
          viewCount: 100, trustScoreSnapshot: 80, status: 'ACTIVE', deletedAt: null,
          company: { trustScore: 85 },
          category: { id: 'cat-1' },
        },
        {
          id: 'prod-2', companyId: 'comp-1', categoryId: 'cat-1',
          viewCount: 50, trustScoreSnapshot: 70, status: 'ACTIVE', deletedAt: null,
          company: { trustScore: 85 },
          category: { id: 'cat-1' },
        },
      ]);

      prisma.orderItem.groupBy
        .mockResolvedValueOnce([{ productId: 'prod-1', _sum: { quantity: 10 } }])
        .mockResolvedValueOnce([{ productId: 'prod-1', _sum: { quantity: 5 } }])
        .mockResolvedValueOnce([{ productId: 'prod-1', _sum: { totalPrice: 1000 } }]);

      prisma.rfq.groupBy.mockResolvedValue([{ categoryId: 'cat-1', _count: { id: 3 } }]);
      prisma.quote.groupBy.mockResolvedValue([{ companyId: 'comp-1', _count: { id: 5 } }]);

      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      expect(prisma.productBestsellerSnapshot.createMany).toHaveBeenCalled();
      const data = prisma.productBestsellerSnapshot.createMany.mock.calls[0][0].data;
      expect(data).toHaveLength(2);
      expect(data[0].rank).toBe(1);
      expect(data[1].rank).toBe(2);
      expect(data[0].productId).toBe('prod-1');
      expect(data[1].productId).toBe('prod-2');
      expect(analytics.trackCalculationTotal).toHaveBeenCalled();
      expect(analytics.trackProductsTotal).toHaveBeenCalledWith(2);
    });
  });

  describe('2. Trending calculation', () => {
    it('should rank products by growthRate descending', async () => {
      prisma.productBestsellerSnapshot.findMany.mockResolvedValue([
        { id: 's1', productId: 'p1', growthRate: 2.5, score: 10, rank: 1, weekStart: mockWeekStart, weekEnd: mockWeekEnd, salesCount: 10, revenue: 100, views: 50, rfqs: 2, quotes: 3, conversionRate: 0.2, trustScore: 80, city: null, state: null, country: 'IN', companyId: 'c1', createdAt: new Date() },
        { id: 's2', productId: 'p2', growthRate: 1.0, score: 8, rank: 2, weekStart: mockWeekStart, weekEnd: mockWeekEnd, salesCount: 5, revenue: 50, views: 30, rfqs: 1, quotes: 2, conversionRate: 0.17, trustScore: 70, city: null, state: null, country: 'IN', companyId: 'c2', createdAt: new Date() },
      ]);

      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1', slug: 'product-1', media: [] },
        { id: 'p2', name: 'Product 2', slug: 'product-2', media: [] },
      ]);

      const result = await service.getTrending({ limit: 10 });
      expect(result).toHaveLength(2);
      expect(result[0].growthRate).toBeGreaterThan(result[1].growthRate);
    });

    it('should filter trending by categoryId', async () => {
      prisma.product.findMany
        .mockResolvedValueOnce([{ id: 'p1' }])
        .mockResolvedValueOnce([{ id: 'p1', name: 'Product 1', slug: 'product-1', media: [] }]);

      prisma.productBestsellerSnapshot.findMany.mockResolvedValue([
        { id: 's1', productId: 'p1', growthRate: 1.5, score: 5, rank: 1, weekStart: mockWeekStart, weekEnd: mockWeekEnd, salesCount: 3, revenue: 30, views: 20, rfqs: 1, quotes: 1, conversionRate: 0.15, trustScore: 75, city: null, state: null, country: 'IN', companyId: 'c1', createdAt: new Date() },
      ]);

      const result = await service.getTrending({ categoryId: 'cat-1' });
      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('p1');
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ categoryId: 'cat-1' }) }),
      );
    });
  });

  describe('3. Rank generation', () => {
    it('should assign sequential ranks based on score', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', companyId: 'c1', categoryId: 'cat-1', viewCount: 100, trustScoreSnapshot: 80, status: 'ACTIVE', deletedAt: null, company: { trustScore: 85 }, category: { id: 'cat-1' } },
        { id: 'p2', companyId: 'c2', categoryId: 'cat-1', viewCount: 80, trustScoreSnapshot: 90, status: 'ACTIVE', deletedAt: null, company: { trustScore: 90 }, category: { id: 'cat-1' } },
      ]);

      prisma.orderItem.groupBy.mockResolvedValue([]);
      prisma.rfq.groupBy.mockResolvedValue([]);
      prisma.quote.groupBy.mockResolvedValue([]);
      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      const data = prisma.productBestsellerSnapshot.createMany.mock.calls[0][0].data;
      expect(data[0].rank).toBe(1);
      expect(data[1].rank).toBe(2);
      expect(data[0].score).toBeGreaterThanOrEqual(data[1].score);
    });
  });

  describe('4. Tie handling', () => {
    it('should handle products with identical scores', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', companyId: 'c1', categoryId: null, viewCount: 0, trustScoreSnapshot: 0, status: 'ACTIVE', deletedAt: null, company: { trustScore: 0 }, category: null },
        { id: 'p2', companyId: 'c2', categoryId: null, viewCount: 0, trustScoreSnapshot: 0, status: 'ACTIVE', deletedAt: null, company: { trustScore: 0 }, category: null },
      ]);

      prisma.orderItem.groupBy.mockResolvedValue([]);
      prisma.rfq.groupBy.mockResolvedValue([]);
      prisma.quote.groupBy.mockResolvedValue([]);
      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      const data = prisma.productBestsellerSnapshot.createMany.mock.calls[0][0].data;
      expect(data[0].rank).toBe(1);
      expect(data[1].rank).toBe(2);
    });
  });

  describe('5. Empty dataset', () => {
    it('should handle no active products gracefully', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.calculateWeeklySnapshots();
      expect(prisma.productBestsellerSnapshot.createMany).not.toHaveBeenCalled();
      expect(analytics.trackProductsTotal).not.toHaveBeenCalled();
    });

    it('should handle no active companies gracefully', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.calculateWeeklySnapshots();
      expect(prisma.sellerBestsellerSnapshot.createMany).not.toHaveBeenCalled();
    });
  });

  describe('6. Category ranking', () => {
    it('should generate category rankings based on product sales', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          products: [{ id: 'p1' }],
        },
        {
          id: 'cat-2',
          products: [{ id: 'p2' }],
        },
      ]);

      prisma.orderItem.groupBy
        .mockResolvedValueOnce([{ productId: 'p1', _sum: { quantity: 20 } }])
        .mockResolvedValueOnce([{ productId: 'p1', _sum: { quantity: 10 } }])
        .mockResolvedValueOnce([{ productId: 'p1', _sum: { totalPrice: 2000 } }])
        .mockResolvedValueOnce([{ productId: 'p2', _sum: { quantity: 5 } }])
        .mockResolvedValueOnce([{ productId: 'p2', _sum: { quantity: 2 } }])
        .mockResolvedValueOnce([{ productId: 'p2', _sum: { totalPrice: 500 } }]);

      prisma.rfq.groupBy.mockResolvedValue([]);
      prisma.quote.groupBy.mockResolvedValue([]);
      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.createMany.mockResolvedValue({ count: 2 });
      prisma.sellerBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      const data = prisma.categoryBestsellerSnapshot.createMany.mock.calls[0][0].data;
      expect(data).toHaveLength(2);
      expect(data[0].categoryId).toBe('cat-1');
      expect(data[0].rank).toBe(1);
      expect(data[1].categoryId).toBe('cat-2');
      expect(data[1].rank).toBe(2);
      expect(analytics.trackCategoriesTotal).toHaveBeenCalledWith(2);
    });
  });

  describe('7. Seller ranking', () => {
    it('should generate seller rankings', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      prisma.company.findMany.mockResolvedValue([
        { id: 'comp-1', trustScore: 90, responseRate: 0.8, products: [{ id: 'p1' }, { id: 'p2' }] },
        { id: 'comp-2', trustScore: 70, responseRate: 0.5, products: [{ id: 'p3' }] },
      ]);

      prisma.order.count
        .mockResolvedValueOnce(15).mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3).mockResolvedValueOnce(1);

      prisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 15000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: 3000 } });

      prisma.category.findMany.mockResolvedValue([]);
      prisma.rfq.groupBy.mockResolvedValue([]);
      prisma.quote.groupBy.mockResolvedValue([]);
      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.createMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      const data = prisma.sellerBestsellerSnapshot.createMany.mock.calls[0][0].data;
      expect(data).toHaveLength(2);
      expect(data[0].companyId).toBe('comp-1');
      expect(data[0].rank).toBe(1);
      expect(data[1].companyId).toBe('comp-2');
      expect(data[1].rank).toBe(2);
      expect(analytics.trackSellersTotal).toHaveBeenCalledWith(2);
    });
  });

  describe('8. Near Me ranking', () => {
    it('should return top products filtered by city', async () => {
      prisma.productBestsellerSnapshot.findMany.mockResolvedValue([
        { id: 's1', productId: 'p1', score: 95, rank: 1, weekStart: mockWeekStart, weekEnd: mockWeekEnd, salesCount: 20, revenue: 200, views: 100, rfqs: 5, quotes: 3, conversionRate: 0.2, trustScore: 85, growthRate: 0.5, city: 'Mumbai', state: null, country: 'IN', companyId: 'c1', createdAt: new Date() },
      ]);

      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1', slug: 'product-1', latitude: 19.076, longitude: 72.8777, media: [] },
      ]);

      const result = await service.getNearMeTop({ city: 'Mumbai', limit: 10 });
      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Mumbai');
      expect(prisma.productBestsellerSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ city: 'Mumbai' }) }),
      );
    });
  });

  describe('9. Snapshot persistence', () => {
    it('should delete old snapshots before creating new ones for the same week', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', companyId: 'c1', categoryId: null, viewCount: 10, trustScoreSnapshot: 50, status: 'ACTIVE', deletedAt: null, company: { trustScore: 50 }, category: null },
      ]);

      prisma.orderItem.groupBy.mockResolvedValue([]);
      prisma.rfq.groupBy.mockResolvedValue([]);
      prisma.quote.groupBy.mockResolvedValue([]);
      prisma.category.findMany.mockResolvedValue([]);
      prisma.company.findMany.mockResolvedValue([]);
      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 1 });
      prisma.categoryBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.createMany.mockResolvedValue({ count: 0 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      expect(prisma.productBestsellerSnapshot.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ weekStart: expect.any(Date) }) }),
      );
      expect(prisma.productBestsellerSnapshot.createMany).toHaveBeenCalled();
    });
  });

  describe('10. Weekly cron execution', () => {
    it('should calculate all snapshot types in one call', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', companyId: 'c1', categoryId: 'cat-1', viewCount: 10, trustScoreSnapshot: 50, status: 'ACTIVE', deletedAt: null, company: { trustScore: 50 }, category: { id: 'cat-1' } },
      ]);

      prisma.orderItem.groupBy.mockResolvedValue([]);
      prisma.rfq.groupBy.mockResolvedValue([]);

      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', products: [{ id: 'p1' }] },
      ]);
      prisma.company.findMany.mockResolvedValue([
        { id: 'c1', trustScore: 50, responseRate: 0.5, products: [{ id: 'p1' }] },
      ]);

      prisma.productBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productBestsellerSnapshot.createMany.mockResolvedValue({ count: 1 });
      prisma.categoryBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.categoryBestsellerSnapshot.createMany.mockResolvedValue({ count: 1 });
      prisma.sellerBestsellerSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.sellerBestsellerSnapshot.createMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((args: any) => Promise.all(args));

      await service.calculateWeeklySnapshots();

      expect(prisma.productBestsellerSnapshot.createMany).toHaveBeenCalled();
      expect(prisma.categoryBestsellerSnapshot.createMany).toHaveBeenCalled();
      expect(prisma.sellerBestsellerSnapshot.createMany).toHaveBeenCalled();
      expect(analytics.trackCalculationTotal).toHaveBeenCalled();
    });
  });

  describe('API: getBestsellers', () => {
    it('should return top bestsellers with product details', async () => {
      const mockSnapshot = {
        id: 's1', productId: 'p1', companyId: 'c1', rank: 1, score: 95,
        weekStart: mockWeekStart, weekEnd: mockWeekEnd,
        salesCount: 20, revenue: 2000, views: 100, rfqs: 5, quotes: 3,
        conversionRate: 0.2, trustScore: 85, growthRate: 0.5,
        city: null, state: null, country: 'IN', createdAt: new Date(),
      };

      prisma.productBestsellerSnapshot.findMany.mockResolvedValue([mockSnapshot]);
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Bestseller', slug: 'bestseller', media: [] },
      ]);

      const result = await service.getBestsellers({ limit: 10 });
      expect(result).toHaveLength(1);
      expect(result[0].product).toBeDefined();
      expect(result[0].product?.name).toBe('Bestseller');
    });
  });
});
