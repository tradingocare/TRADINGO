import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class NotificationAnalyticsService {
  private readonly logger = new Logger(NotificationAnalyticsService.name);

  constructor(private readonly eventIngestion: EventIngestionService) {}

  async trackEvent(
    companyId: string,
    notificationId: string,
    channel: string,
    eventType: string,
    attemptCount?: number,
    metadata?: Record<string, unknown>,
  ) {
    await this.eventIngestion.track('notification_analytics_events', {
      companyId,
      notificationId,
      channel,
      eventType,
      attemptCount,
      metadata,
    });
    this.logger.log({ msg: 'NotificationAnalyticsEvent', companyId, notificationId, channel, eventType, attemptCount, metadata });
  }
}