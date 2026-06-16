import { Test, TestingModule } from '@nestjs/testing';
import { EscrowAnalyticsService } from './escrow-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('EscrowAnalyticsService', () => {
  let service: EscrowAnalyticsService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      escrow: { count: jest.fn() },
      settlement: { count: jest.fn(), aggregate: jest.fn() },
    };
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowAnalyticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<EscrowAnalyticsService>(EscrowAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track escrow analytics event via payment_analytics_events', async () => {
      await service.trackEvent('c1', 'esc-1', 'ESCROW_HELD', { amount: 500 });
      expect(eventIngestion.track).toHaveBeenCalledWith('payment_analytics_events', {
        companyId: 'c1',
        paymentId: 'esc-1',
        eventType: 'ESCROW_HELD',
        metadata: { amount: 500 },
      });
    });

    it('should handle undefined escrowId', async () => {
      await service.trackEvent('c1', undefined, 'ESCROW_RELEASED');
      expect(eventIngestion.track).toHaveBeenCalledWith('payment_analytics_events', {
        companyId: 'c1',
        paymentId: undefined,
        eventType: 'ESCROW_RELEASED',
        metadata: undefined,
      });
    });
  });

  describe('getEscrowMetrics', () => {
    it('should return escrow metrics', async () => {
      prisma.escrow.count
        .mockResolvedValueOnce(10)   // HELD
        .mockResolvedValueOnce(30)   // RELEASED
        .mockResolvedValueOnce(5)    // REFUNDED
        .mockResolvedValueOnce(3);   // DISPUTED
      prisma.settlement.aggregate.mockResolvedValue({ _sum: { amount: 20000 } });
      prisma.settlement.count.mockResolvedValue(2);

      const metrics = await service.getEscrowMetrics('c1');
      expect(metrics.totalEscrowHeld).toBe(10);
      expect(metrics.releasedAmount).toBe(20000);
      expect(metrics.refundRate).toBeGreaterThan(0);
      expect(metrics.disputeRate).toBeGreaterThan(0);
      expect(metrics.settlementSuccessRate).toBeGreaterThan(0);
      expect(metrics.pendingSettlement).toBe(2);
    });
  });
});
