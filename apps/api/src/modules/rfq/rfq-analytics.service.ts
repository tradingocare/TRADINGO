import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';

@Injectable()
export class RfqAnalyticsService {
  private readonly logger = new Logger(RfqAnalyticsService.name);

  constructor(private readonly eventIngestion: EventIngestionService) {}

  async trackEvent(companyId: string, rfqId: string, eventType: string, metadata?: Record<string, unknown>) {
    await this.eventIngestion.track('rfq_analytics_events', {
      companyId,
      rfqId,
      eventType,
      metadata,
    });
    this.logger.log({ msg: 'RfqAnalyticsEvent', companyId, rfqId, eventType, metadata });
  }

  async trackMatchEvent(rfqId: string, companyId: string, vendorCount: number, averageScore: number, topScore: number) {
    await this.eventIngestion.track('rfq_analytics_events', {
      companyId,
      rfqId,
      eventType: 'MATCHED',
      metadata: { vendorCount, averageScore, topScore },
    });
    this.logger.log({ msg: 'RfqMatchEvent', companyId, rfqId, vendorCount, averageScore, topScore });
  }
}
