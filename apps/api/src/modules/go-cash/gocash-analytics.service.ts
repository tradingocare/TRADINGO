import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class GoCashAnalyticsService {
  private readonly logger = new Logger(GoCashAnalyticsService.name);

  constructor(private readonly eventIngestion: EventIngestionService) {}

  async trackEvent(
    companyId: string,
    transactionId: string,
    eventType: string,
    transactionType: string,
    amount: number,
    balanceAfter: number,
    metadata?: Record<string, unknown>,
  ) {
    await this.eventIngestion.track('gocash_analytics_events', {
      companyId,
      transactionId,
      eventType,
      transactionType,
      amount,
      balanceAfter,
      metadata,
    });
    this.logger.log({ msg: 'GoCashAnalyticsEvent', companyId, transactionId, eventType, transactionType, amount, balanceAfter, metadata });
  }
}