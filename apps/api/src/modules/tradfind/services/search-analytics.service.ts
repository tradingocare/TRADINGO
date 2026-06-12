import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { SearchAnalyticsEvent } from '../interfaces/search-types';

@Injectable()
export class SearchAnalyticsService {
  private readonly client: ClickHouseClient;
  private readonly logger = new Logger(SearchAnalyticsService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>('clickhouse.url'),
      username: this.configService.get<string>('clickhouse.username'),
      password: this.configService.get<string>('clickhouse.password'),
    });
  }

  async trackSearch(event: SearchAnalyticsEvent): Promise<void> {
    try {
      await this.client.insert({
        table: 'search_analytics',
        values: [
          {
            user_id: event.userId || '',
            session_id: event.sessionId || '',
            query: event.query,
            entity_type: event.entityType || '',
            result_count: event.resultCount,
            clicked_result_id: event.clickedResultId || '',
            clicked_result_type: event.clickedResultType || '',
            latitude: event.latitude ?? 0,
            longitude: event.longitude ?? 0,
            ip_address: event.ipAddress || '',
            user_agent: event.userAgent || '',
            timestamp: event.timestamp.toISOString(),
          },
        ],
        format: 'JSONEachRow',
      });
    } catch (err) {
      this.logger.error(`Failed to track search analytics: ${(err as Error).message}`);
    }
  }

  async trackClick(
    query: string,
    resultId: string,
    resultType: string,
    userId?: string,
  ): Promise<void> {
    await this.trackSearch({
      query,
      clickedResultId: resultId,
      clickedResultType: resultType,
      userId,
      resultCount: 0,
      timestamp: new Date(),
    });
  }

  async getPopularQueries(limit: number = 20): Promise<{ query: string; count: number }[]> {
    try {
      const result = await this.client.query({
        query: `
          SELECT query, count(*) as count
          FROM search_analytics
          WHERE timestamp >= now() - INTERVAL 30 DAY
          GROUP BY query
          ORDER BY count DESC
          LIMIT ${limit}
        `,
        format: 'JSONEachRow',
      });
      return (await result.json()) as { query: string; count: number }[];
    } catch (err) {
      this.logger.error(`Failed to get popular queries: ${(err as Error).message}`);
      return [];
    }
  }

  async getSearchAnalyticsSummary(): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsPerSearch: number;
    topQueries: { query: string; count: number }[];
  }> {
    try {
      const summary = await this.client.query({
        query: `
          SELECT
            count(*) as total_searches,
            count(distinct query) as unique_queries,
            avg(result_count) as avg_results
          FROM search_analytics
          WHERE timestamp >= now() - INTERVAL 30 DAY
        `,
        format: 'JSONEachRow',
      });
      const rows = (await summary.json()) as any[];
      const top = await this.getPopularQueries(10);

      const row = rows[0] || {};
      return {
        totalSearches: Number(row.total_searches) || 0,
        uniqueQueries: Number(row.unique_queries) || 0,
        avgResultsPerSearch: Math.round(Number(row.avg_results) * 100) / 100 || 0,
        topQueries: top,
      };
    } catch (err) {
      this.logger.error(`Failed to get search analytics summary: ${(err as Error).message}`);
      return { totalSearches: 0, uniqueQueries: 0, avgResultsPerSearch: 0, topQueries: [] };
    }
  }
}
