import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';

export type ChatEventType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_READ'
  | 'FILE_SHARED'
  | 'RFQ_NEGOTIATION_STARTED'
  | 'USER_BLOCKED'
  | 'REPORT_CREATED';

@Injectable()
export class ChatAnalyticsService {
  private readonly logger = new Logger(ChatAnalyticsService.name);

  constructor(private readonly eventIngestion: EventIngestionService) {}

  async trackEvent(
    type: ChatEventType,
    companyId: string,
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.eventIngestion.track('chat_analytics_events', {
        companyId,
        eventType: type,
        userId,
        metadata,
      });
    } catch (err) {
      this.logger.error(`Failed to track chat event ${type}: ${(err as Error).message}`);
    }
  }
}
