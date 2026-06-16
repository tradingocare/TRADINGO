import { Test, TestingModule } from '@nestjs/testing';
import { RfqAnalyticsService } from './rfq-analytics.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('RfqAnalyticsService', () => {
  let service: RfqAnalyticsService;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqAnalyticsService,
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<RfqAnalyticsService>(RfqAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track RFQ analytics event', async () => {
      await service.trackEvent('c1', 'rfq-1', 'RFQ_SUBMITTED', { source: 'web' });
      expect(eventIngestion.track).toHaveBeenCalledWith('rfq_analytics_events', {
        companyId: 'c1',
        rfqId: 'rfq-1',
        eventType: 'RFQ_SUBMITTED',
        metadata: { source: 'web' },
      });
    });

    it('should handle missing metadata', async () => {
      await service.trackEvent('c1', 'rfq-1', 'RFQ_EXPIRED');
      expect(eventIngestion.track).toHaveBeenCalledWith('rfq_analytics_events', {
        companyId: 'c1',
        rfqId: 'rfq-1',
        eventType: 'RFQ_EXPIRED',
        metadata: undefined,
      });
    });
  });

  describe('trackMatchEvent', () => {
    it('should track match event with scoring data', async () => {
      await service.trackMatchEvent('rfq-1', 'c1', 5, 85.5, 98);
      expect(eventIngestion.track).toHaveBeenCalledWith('rfq_analytics_events', {
        companyId: 'c1',
        rfqId: 'rfq-1',
        eventType: 'MATCHED',
        metadata: { vendorCount: 5, averageScore: 85.5, topScore: 98 },
      });
    });
  });
});
