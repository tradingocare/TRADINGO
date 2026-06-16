import { Test, TestingModule } from '@nestjs/testing';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { EventIngestionService } from '../analytics/event-ingestion.service';

describe('NotificationAnalyticsService', () => {
  let service: NotificationAnalyticsService;
  let eventIngestion: Record<string, jest.Mock>;

  beforeEach(async () => {
    eventIngestion = { track: jest.fn(), trackBatch: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationAnalyticsService,
        { provide: EventIngestionService, useValue: eventIngestion },
      ],
    }).compile();

    service = module.get<NotificationAnalyticsService>(NotificationAnalyticsService);
  });

  describe('trackEvent', () => {
    it('should track notification analytics event', async () => {
      await service.trackEvent('c1', 'notif-1', 'email', 'NOTIFICATION_SENT', 1, { template: 'welcome' });
      expect(eventIngestion.track).toHaveBeenCalledWith('notification_analytics_events', {
        companyId: 'c1',
        notificationId: 'notif-1',
        channel: 'email',
        eventType: 'NOTIFICATION_SENT',
        attemptCount: 1,
        metadata: { template: 'welcome' },
      });
    });

    it('should handle missing optional fields', async () => {
      await service.trackEvent('c1', 'notif-2', 'sms', 'NOTIFICATION_FAILED');
      expect(eventIngestion.track).toHaveBeenCalledWith('notification_analytics_events', {
        companyId: 'c1',
        notificationId: 'notif-2',
        channel: 'sms',
        eventType: 'NOTIFICATION_FAILED',
        attemptCount: undefined,
        metadata: undefined,
      });
    });
  });
});
