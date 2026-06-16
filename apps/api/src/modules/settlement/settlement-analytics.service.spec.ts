import { Test, TestingModule } from '@nestjs/testing';
import { SettlementAnalyticsService } from './settlement-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('SettlementAnalyticsService', () => {
  let service: SettlementAnalyticsService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      settlement: { count: jest.fn(), aggregate: jest.fn() },
    };
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementAnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<SettlementAnalyticsService>(SettlementAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track settlement analytics event', async () => {
      await service.trackEvent('c1', 'sett-1', 'SETTLEMENT_COMPLETED', { amount: 5000 });
      expect(eventIngestion.track).toHaveBeenCalledWith('settlement_analytics_events', {
        companyId: 'c1',
        settlementId: 'sett-1',
        eventType: 'SETTLEMENT_COMPLETED',
        metadata: { amount: 5000 },
      });
    });
  });

  describe('getSettlementMetrics', () => {
    it('should return settlement metrics', async () => {
      prisma.settlement.count
        .mockResolvedValueOnce(50)   // totalProcessed
        .mockResolvedValueOnce(5);   // totalFailed
      prisma.settlement.aggregate.mockResolvedValue({ _sum: { amount: 100000 } });

      const metrics = await service.getSettlementMetrics('c1');
      expect(metrics.totalProcessed).toBe(50);
      expect(metrics.totalAmount).toBe(100000);
      expect(metrics.successRate).toBeCloseTo(90.91, 1);
    });
  });
});
