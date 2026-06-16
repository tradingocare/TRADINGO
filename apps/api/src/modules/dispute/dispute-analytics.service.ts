import { Injectable, Logger } from '@nestjs/common';
import { EventIngestionService } from '../analytics/event-ingestion.service';
import { ClickhouseService } from '../analytics/clickhouse.service';

export interface DisputeAnalyticsEvent {
  companyId: string;
  disputeId: string | null;
  eventType: string;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

@Injectable()
export class DisputeAnalyticsService {
  private readonly logger = new Logger(DisputeAnalyticsService.name);

  constructor(
    private readonly eventIngestion: EventIngestionService,
    private readonly clickhouse: ClickhouseService,
  ) {}

  async trackEvent(companyId: string, disputeId: string | undefined, eventType: string, metadata?: Record<string, unknown>) {
    await this.eventIngestion.track('dispute_analytics_events', {
      companyId,
      disputeId: disputeId ?? null,
      eventType,
      metadata: metadata ?? undefined,
    });
    this.logger.log({ msg: 'DisputeAnalyticsEvent', companyId, disputeId, eventType, metadata });
  }

  async getDisputeMetrics(companyId: string) {
    const result = await this.clickhouse.query<{
      total_disputes: number;
      resolved_disputes: number;
      sla_breaches: number;
    }>(
      `SELECT sum(total_disputes) AS total_disputes,
              sum(resolved_disputes) AS resolved_disputes,
              sum(sla_breaches) AS sla_breaches
       FROM tradingo.dispute_metrics
       WHERE company_id = {companyId:String}`,
      { companyId },
    );

    const stats = result[0] ?? { total_disputes: 0, resolved_disputes: 0, sla_breaches: 0 };

    return {
      totalDisputes: Number(stats.total_disputes),
      openDisputes: 0,
      resolvedDisputes: Number(stats.resolved_disputes),
      avgResolutionTime: 0,
      refundRate: 0,
      disputeRate: 0,
      fraudRate: 0,
      appealRate: 0,
    };
  }
}
