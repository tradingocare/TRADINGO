import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { ClickhouseService } from './clickhouse.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let clickhouse: any;

  beforeEach(async () => {
    clickhouse = {
      query: jest.fn(),
      insert: jest.fn(),
      exec: jest.fn(),
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: ClickhouseService, useValue: clickhouse },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSellerDashboard', () => {
    it('should return dashboard with overview', async () => {
      clickhouse.query.mockResolvedValue([
        { day: '2026-06-01', orders: 10, rfqs: 5, quotes_sent: 8, quotes_accepted: 3, profile_views: 100, product_views: 50, search_impressions: 200, search_clicks: 20, revenue: 5000 },
      ]);

      const result = await service.getSellerDashboard('c1', { range: '30d' });
      expect(result.overview).toBeDefined();
      expect(result.overview.revenue).toBe(5000);
      expect(result.overview.orders).toBe(10);
      expect(result.daily).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      clickhouse.query.mockResolvedValue([]);

      const result = await service.getSellerDashboard('c1', { range: '30d' });
      expect(result.overview.revenue).toBe(0);
      expect(result.overview.orders).toBe(0);
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard metrics', async () => {
      clickhouse.query
        .mockResolvedValueOnce([{ total_sellers: 100, total_rfqs: 500 }])
        .mockResolvedValueOnce([{ total_orders: 50, revenue: 100000 }])
        .mockResolvedValueOnce([{ total_disputes: 10, resolved_disputes: 5, sla_breaches: 1 }])
        .mockResolvedValueOnce([{ total_payments: 200 }])
        .mockResolvedValueOnce([{ total_orders: 20, revenue: 40000 }])
        .mockResolvedValueOnce([{ total_orders: 30, revenue: 60000 }]);

      const result = await service.getAdminDashboard({ range: '30d' });
      expect(result.gmv).toBe(100000);
      expect(result.totalSellers).toBe(100);
    });
  });

  describe('getSellerLeaderboard', () => {
    it('should return leaderboard data', async () => {
      clickhouse.query.mockResolvedValue([
        { company_id: 'c1', total_orders: 100, total_revenue: 50000, rank: 1 },
        { company_id: 'c2', total_orders: 50, total_revenue: 25000, rank: 2 },
      ]);

      const result = await service.getSellerLeaderboard(10);
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
    });
  });

  describe('getCharts', () => {
    it('should return chart data', async () => {
      clickhouse.query.mockResolvedValue([
        { day: '2026-06-01', orders: 10, rfqs: 5, quotes_sent: 3, quotes_accepted: 2, profile_views: 50, product_views: 25, search_impressions: 100, search_clicks: 10, revenue: 3000 },
      ]);

      const result = await service.getCharts('c1', { range: '30d' });
      expect(result.daily).toHaveLength(1);
    });
  });
});
