import { Test, TestingModule } from '@nestjs/testing';
import { ChatAnalyticsService } from './chat-analytics.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('ChatAnalyticsService', () => {
  let service: ChatAnalyticsService;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatAnalyticsService,
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<ChatAnalyticsService>(ChatAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track chat analytics event', async () => {
      await service.trackEvent('MESSAGE_SENT', 'c1', 'u1', { conversationId: 'conv-1' });
      expect(eventIngestion.track).toHaveBeenCalledWith('chat_analytics_events', {
        companyId: 'c1',
        eventType: 'MESSAGE_SENT',
        userId: 'u1',
        metadata: { conversationId: 'conv-1' },
      });
    });

    it('should handle ClickHouse unavailable gracefully', async () => {
      eventIngestion.track.mockRejectedValue(new Error('ClickHouse unavailable'));
      await expect(service.trackEvent('MESSAGE_READ', 'c1', 'u1')).resolves.not.toThrow();
    });

    it('should handle undefined metadata', async () => {
      await service.trackEvent('FILE_SHARED', 'c1', 'u1');
      expect(eventIngestion.track).toHaveBeenCalledWith('chat_analytics_events', {
        companyId: 'c1',
        eventType: 'FILE_SHARED',
        userId: 'u1',
        metadata: undefined,
      });
    });
  });
});
