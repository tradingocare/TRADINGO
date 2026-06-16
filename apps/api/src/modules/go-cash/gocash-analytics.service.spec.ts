import { Test, TestingModule } from '@nestjs/testing';
import { GoCashAnalyticsService } from './gocash-analytics.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('GoCashAnalyticsService', () => {
  let service: GoCashAnalyticsService;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoCashAnalyticsService,
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<GoCashAnalyticsService>(GoCashAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track GoCash analytics event', async () => {
      await service.trackEvent('c1', 'tx-1', 'GOCASH_EARNED', 'REFERRAL', 500, 2500, { referrer: 'u2' });
      expect(eventIngestion.track).toHaveBeenCalledWith('gocash_analytics_events', {
        companyId: 'c1',
        transactionId: 'tx-1',
        eventType: 'GOCASH_EARNED',
        transactionType: 'REFERRAL',
        amount: 500,
        balanceAfter: 2500,
        metadata: { referrer: 'u2' },
      });
    });

    it('should track redemption events', async () => {
      await service.trackEvent('c1', 'tx-2', 'GOCASH_REDEEMED', 'PURCHASE', 200, 800);
      expect(eventIngestion.track).toHaveBeenCalledWith('gocash_analytics_events', {
        companyId: 'c1',
        transactionId: 'tx-2',
        eventType: 'GOCASH_REDEEMED',
        transactionType: 'PURCHASE',
        amount: 200,
        balanceAfter: 800,
        metadata: undefined,
      });
    });
  });
});
