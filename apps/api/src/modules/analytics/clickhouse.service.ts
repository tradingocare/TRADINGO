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
  private readonly client: ClickHouseClient | null;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('clickhouse.url')?.trim();
    if (!url) {
      // Optional infrastructure: no endpoint configured => no client is created
      // and analytics degrade to Prisma aggregations (DEGRADATION_MATRIX).
      this.client = null;
      this.logger.warn('ClickHouse is not configured — analytics will fall back to Prisma aggregations');
      return;
    }
    this.client = createClient({
      url,
      username: this.configService.get<string>('clickhouse.username'),
      password: this.configService.get<string>('clickhouse.password'),
      database: 'tradingo',
    });
  }

  /** True when a ClickHouse endpoint is configured and the client is active. */
  isEnabled(): boolean {
    return this.client !== null;
  }

  async insert(table: AnalyticsTable, values: Record<string, unknown>[]): Promise<void> {
    if (values.length === 0) return;
    if (!this.client) {
      this.logger.warn(`Skipping ClickHouse insert into ${table}: ClickHouse is not configured`);
      return;
    }
    await this.client.insert({
      table: `tradingo.${table}`,
      values,
      format: 'JSONEachRow',
    });
  }

  async query<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    if (!this.client) {
      this.logger.warn('Skipping ClickHouse query: ClickHouse is not configured');
      return [];
    }
    const result = await this.client.query({
      query: sql,
      format: 'JSONEachRow',
      query_params: params,
    });
    return result.json() as Promise<T[]>;
  }

  async exec(sql: string): Promise<void> {
    if (!this.client) {
      this.logger.warn('Skipping ClickHouse exec: ClickHouse is not configured');
      return;
    }
    await this.client.exec({ query: sql });
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      return result.success;
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    this.client?.close();
  }
}
