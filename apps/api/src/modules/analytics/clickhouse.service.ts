import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

export type AnalyticsTable =
  | 'seller_analytics_events'
  | 'rfq_analytics_events'
  | 'order_analytics_events'
  | 'chat_analytics_events'
  | 'notification_analytics_events'
  | 'dispute_analytics_events'
  | 'payment_analytics_events'
  | 'settlement_analytics_events'
  | 'gocash_analytics_events';

@Injectable()
export class ClickhouseService implements OnModuleDestroy {
  private readonly client: ClickHouseClient;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>('clickhouse.url'),
      username: this.configService.get<string>('clickhouse.username'),
      password: this.configService.get<string>('clickhouse.password'),
      database: 'tradingo',
    });
  }

  async insert(table: AnalyticsTable, values: Record<string, unknown>[]): Promise<void> {
    if (values.length === 0) return;
    await this.client.insert({
      table: `tradingo.${table}`,
      values,
      format: 'JSONEachRow',
    });
  }

  async query<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: params,
    });
    return result.json() as Promise<T[]>;
  }

  async exec(sql: string): Promise<void> {
    await this.client.exec({ query: sql });
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result.success;
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    this.client.close();
  }
}
