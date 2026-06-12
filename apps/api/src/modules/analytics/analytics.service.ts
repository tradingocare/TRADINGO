import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

export interface AnalyticsEvent {
  userId: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly client: ClickHouseClient;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>('clickhouse.url'),
      username: this.configService.get<string>('clickhouse.username'),
      password: this.configService.get<string>('clickhouse.password'),
    });
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    await this.client.insert({
      table: 'analytics_events',
      values: [
        {
          user_id: event.userId,
          event: event.event,
          properties: JSON.stringify(event.properties),
          timestamp: event.timestamp.toISOString(),
        },
      ],
      format: 'JSONEachRow',
    });
  }

  async query(sql: string): Promise<unknown[]> {
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
    });

    return result.json();
  }
}
