import { Test, TestingModule } from '@nestjs/testing';
import { EventIngestionService } from './event-ingestion.service';
import { ClickhouseService } from './clickhouse.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('EventIngestionService', () => {
  let service: EventIngestionService;
  let clickhouse: any;
  let analyticsQueue: any;

  beforeEach(async () => {
    clickhouse = {
      insert: jest.fn(),
    };

    analyticsQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventIngestionService,
        { provide: ClickhouseService, useValue: clickhouse },
        { provide: getQueueToken('analytics'), useValue: analyticsQueue },
      ],
    }).compile();

    service = module.get<EventIngestionService>(EventIngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('track', () => {
    it('should buffer events and flush on batch size threshold', async () => {
      for (let i = 0; i < 1000; i++) {
        await service.track('seller_analytics_events', {
          companyId: 'c1',
          eventType: 'PROFILE_VIEW',
        });
      }

      await service.flush('seller_analytics_events');
      expect(clickhouse.insert).toHaveBeenCalled();
    });

    it('should handle single event tracking', async () => {
      await service.track('seller_analytics_events', {
        companyId: 'c1',
        eventType: 'ORDER_PLACED',
        amount: 5000,
        currency: 'INR',
      });

      expect(service.getBatchSize('seller_analytics_events')).toBe(1);
    });
  });

  describe('trackBatch', () => {
    it('should batch multiple events', async () => {
      const events = Array.from({ length: 50 }, (_, i) => ({
        companyId: 'c1',
        eventType: 'PROFILE_VIEW',
        userId: `u${i}`,
      }));

      await service.trackBatch('seller_analytics_events', events);
      expect(service.getBatchSize('seller_analytics_events')).toBe(50);
    });
  });

  describe('flush', () => {
    it('should flush specific table', async () => {
      await service.track('seller_analytics_events', { companyId: 'c1', eventType: 'TEST' });
      await service.flush('seller_analytics_events');
      expect(clickhouse.insert).toHaveBeenCalled();
    });

    it('should flush all tables', async () => {
      await service.track('seller_analytics_events', { companyId: 'c1', eventType: 'TEST' });
      await service.track('rfq_analytics_events', { companyId: 'c1', eventType: 'RFQ_CREATED', rfqId: 'r1' });
      await service.flush();
      expect(clickhouse.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('dead letter', () => {
    it('should move failed events to dead letter', async () => {
      clickhouse.insert.mockRejectedValue(new Error('DB error'));

      await service.track('seller_analytics_events', { companyId: 'c1', eventType: 'TEST' });
      await service.flush('seller_analytics_events');

      expect(service.getDeadLetterCount()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getBatchSize', () => {
    it('should return 0 for empty table', () => {
      expect(service.getBatchSize('seller_analytics_events')).toBe(0);
    });

    it('should return correct count', async () => {
      await service.track('seller_analytics_events', { companyId: 'c1', eventType: 'TEST' });
      expect(service.getBatchSize('seller_analytics_events')).toBe(1);
    });
  });
});
