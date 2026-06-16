import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class PaymentAnalyticsService {
  private readonly logger = new Logger(PaymentAnalyticsService.name);

  constructor(private readonly eventIngestion: EventIngestionService) {}

  async trackEvent(
    companyId: string,
    paymentId: string,
    eventType: string,
    amount?: number,
    currency?: string,
    gateway?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.eventIngestion.track('payment_analytics_events', {
      companyId,
      paymentId,
      eventType,
      amount,
      currency,
      gateway,
      metadata,
    });
    this.logger.log({ msg: 'PaymentAnalyticsEvent', companyId, paymentId, eventType, amount, currency, gateway, metadata });
  }
}