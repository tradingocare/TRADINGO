import { Test, TestingModule } from '@nestjs/testing';
import { SellerAnalyticsService } from './seller-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsTimeRange } from './dto/analytics-query.dto';

describe('SellerAnalyticsService', () => {
  let service: SellerAnalyticsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn() },
      sellerAnalyticsEvent: { findMany: jest.fn(), create: jest.fn() },
      goCashTransaction: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerAnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellerAnalyticsService>(SellerAnalyticsService);
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard KPIs', async () => {
      prisma.company.findFirst.mockResolvedValue({
        trustScore: 85,
        responseRate: 90,
        profileCompletionPercentage: 75,
        goCashBalance: 500,
        totalProducts: 10,
        createdAt: new Date(),
      });
      prisma.sellerAnalyticsEvent.findMany.mockResolvedValue([
        { eventType: 'PROFILE_VIEW' },
        { eventType: 'PROFILE_VIEW' },
        { eventType: 'PRODUCT_VIEW' },
        { eventType: 'RFQ_SUBMITTED' },
        { eventType: 'SEARCH_IMPRESSION' },
        { eventType: 'SEARCH_IMPRESSION' },
        { eventType: 'SEARCH_CLICK' },
        { eventType: 'QUOTE_SENT' },
        { eventType: 'QUOTE_ACCEPTED' },
      ]);
      prisma.goCashTransaction.findMany.mockResolvedValue([{ type: 'EARNED', amount: 200 }]);
      const dashboard = await service.getDashboardSummary('c1', AnalyticsTimeRange.DAYS_30);
      expect(dashboard?.profileViews).toBe(2);
      expect(dashboard?.productViews).toBe(1);
      expect(dashboard?.rfqs).toBe(1);
      expect(dashboard?.trustScore).toBe(85);
      expect(dashboard?.ctr).toBe(50);
      expect(dashboard?.goCashEarned).toBe(200);
    });

    it('should return null for non-existent company', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      const result = await service.getDashboardSummary('unknown');
      expect(result).toBeNull();
    });
  });

  describe('getCharts', () => {
    it('should return daily chart data', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', createdAt: new Date() });
      prisma.sellerAnalyticsEvent.findMany.mockResolvedValue([]);
      const charts = await service.getCharts('c1');
      expect(charts.daily).toBeDefined();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance with GoCash history', async () => {
      prisma.company.findFirst.mockResolvedValue({
        trustScore: 80, responseRate: 85, profileCompletionPercentage: 90, goCashBalance: 300, totalProducts: 5, createdAt: new Date(),
      });
      prisma.sellerAnalyticsEvent.findMany.mockResolvedValue([]);
      prisma.goCashTransaction.findMany.mockResolvedValue([]);
      const metrics = await service.getPerformanceMetrics('c1');
      expect(metrics?.overview).toBeDefined();
      expect(metrics?.goCashHistory).toBeDefined();
    });
  });

  describe('trackEvent', () => {
    it('should create analytics event', async () => {
      prisma.sellerAnalyticsEvent.create.mockResolvedValue({ id: 'event1', eventType: 'PROFILE_VIEW' } as any);
      const event = await service.trackEvent('c1', 'PROFILE_VIEW', { source: 'search' });
      expect(event.eventType).toBe('PROFILE_VIEW');
    });
  });
});
