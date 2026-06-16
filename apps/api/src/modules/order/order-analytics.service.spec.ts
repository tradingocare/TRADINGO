import { Test, TestingModule } from '@nestjs/testing';
import { OrderAnalyticsService } from './order-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('OrderAnalyticsService', () => {
  let service: OrderAnalyticsService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      order: { count: jest.fn(), aggregate: jest.fn() },
    };
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderAnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<OrderAnalyticsService>(OrderAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track order analytics event', async () => {
      await service.trackEvent('c1', 'order-1', 'ORDER_PLACED', { amount: 1000 });
      expect(eventIngestion.track).toHaveBeenCalledWith('order_analytics_events', {
        companyId: 'c1',
        orderId: 'order-1',
        eventType: 'ORDER_PLACED',
        metadata: { amount: 1000 },
      });
    });

    it('should handle undefined orderId', async () => {
      await service.trackEvent('c1', undefined, 'ORDER_CANCELLED');
      expect(eventIngestion.track).toHaveBeenCalledWith('order_analytics_events', {
        companyId: 'c1',
        orderId: undefined,
        eventType: 'ORDER_CANCELLED',
        metadata: undefined,
      });
    });
  });

  describe('getOrderMetrics', () => {
    it('should return computed order metrics', async () => {
      prisma.order.count
        .mockResolvedValueOnce(100)  // totalOrders
        .mockResolvedValueOnce(60)   // completedOrders
        .mockResolvedValueOnce(20)   // cancelledOrders
        .mockResolvedValueOnce(10)   // returnedOrders
        .mockResolvedValueOnce(30);  // repeatOrders
      prisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 50000 } });

      const metrics = await service.getOrderMetrics('c1');
      expect(metrics.totalOrders).toBe(100);
      expect(metrics.completedOrders).toBe(60);
      expect(metrics.cancelledOrders).toBe(20);
      expect(metrics.returnedOrders).toBe(10);
      expect(metrics.revenue).toBe(50000);
      expect(metrics.averageOrderValue).toBe(500);
      expect(metrics.repeatOrders).toBe(30);
      expect(metrics.cancellationRate).toBe(20);
      expect(metrics.returnRate).toBe(10);
    });
  });
});
