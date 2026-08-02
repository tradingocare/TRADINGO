import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingEvent } from './clickhouse.provider';

@Injectable()
export class Ga4TrackingProvider {
  private readonly logger = new Logger(Ga4TrackingProvider.name);
  private readonly measurementId: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;
  private readonly baseUrl = 'https://www.google-analytics.com/mp/collect';

  constructor(private readonly configService: ConfigService) {
    this.measurementId = this.configService.get('GA4_MEASUREMENT_ID') || '';
    this.apiSecret = this.configService.get('GA4_API_SECRET') || '';
    this.enabled = !!(this.measurementId && this.apiSecret);
  }

  async send(events: TrackingEvent[]): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`GA4 tracking skipped (not configured): ${events.length} events`);
      return;
    }
    try {
      const ga4Events = events.map((e) => ({
        name: e.event.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40),
        params: {
          session_id: e.sessionId,
          page_location: e.pageUrl,
          user_id: e.userId,
          engagement_time_msec: 1,
          ...e.properties,
          ...e.utm,
        },
      }));

      await fetch(`${this.baseUrl}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: events[0]?.userId || events[0]?.sessionId || 'anonymous',
          events: ga4Events,
        }),
        signal: AbortSignal.timeout(5000),
      });
      this.logger.log(`Sent ${events.length} events to GA4`);
    } catch (err) {
      this.logger.error(`GA4 send failed: ${(err as Error).message}`);
    }
  }
}
