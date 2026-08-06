import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TrackingEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  pageUrl?: string;
  properties?: Record<string, unknown>;
  utm?: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
}

@Injectable()
export class ClickhouseTrackingProvider {
  private readonly logger = new Logger(ClickhouseTrackingProvider.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = !!this.configService.get('clickhouse.url');
  }

  async send(events: TrackingEvent[]): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Tracking skipped (ClickHouse disabled): ${events.length} events`);
      return;
    }
    try {
      const url = this.configService.get('clickhouse.url');
      const username = this.configService.get('clickhouse.username') || 'default';
      const password = this.configService.get('clickhouse.password') || '';

      const auth = btoa(`${username}:${password}`);

      for (const event of events) {
        const row = {
          event: event.event,
          user_id: event.userId || '',
          session_id: event.sessionId || '',
          page_url: event.pageUrl || '',
          properties: JSON.stringify(event.properties || {}),
          utm: JSON.stringify(event.utm || {}),
          user_agent: event.userAgent || '',
          ip_address: event.ipAddress || '',
          created_at: event.timestamp,
        };
        const query = `INSERT INTO tracking_events FORMAT JSONEachRow ${JSON.stringify(row)}`;
        await fetch(url!, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'text/plain',
          },
          body: query,
          signal: AbortSignal.timeout(5000),
        });
      }
      if (events.length > 0) {
        this.logger.log(`Sent ${events.length} events to ClickHouse`);
      }
    } catch (err) {
      this.logger.error(`ClickHouse insert failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
