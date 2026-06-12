import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { TrendingSearchEntry } from '../interfaces/search-types';
import { SUGGESTIONS_CACHE_TTL } from '../enums/search.enums';

@Injectable()
export class TrendingSearchService {
  private readonly logger = new Logger(TrendingSearchService.name);
  private readonly DAILY_KEY = 'tradfind:trending:daily';
  private readonly WEEKLY_KEY = 'tradfind:trending:weekly';
  private readonly MONTHLY_KEY = 'tradfind:trending:monthly';

  constructor(private readonly redisService: RedisService) {}

  async trackSearch(query: string): Promise<void> {
    if (!query || query.trim().length === 0) return;

    const today = new Date().toISOString().slice(0, 10);

    try {
      const dailyKey = `${this.DAILY_KEY}:${today}`;
      await this.redisService.get(dailyKey);
      await this.redisService.set(
        dailyKey,
        await this.incrementInRedis(dailyKey, query),
        SUGGESTIONS_CACHE_TTL,
      );

      await this.redisService.set(
        this.WEEKLY_KEY,
        await this.incrementInRedis(this.WEEKLY_KEY, query),
        604800,
      );
      await this.redisService.set(
        this.MONTHLY_KEY,
        await this.incrementInRedis(this.MONTHLY_KEY, query),
        2592000,
      );

      await this.redisService.incr(`tradfind:trending:count:${query}`);
    } catch (err) {
      this.logger.warn(`Failed to track trending search: ${(err as Error).message}`);
    }
  }

  async getTrendingSearches(
    limit: number = 10,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<TrendingSearchEntry[]> {
    try {
      const key = this.getPeriodKey(period);
      const cached = await this.redisService.get(key);
      if (cached) {
        const entries = JSON.parse(cached) as TrendingSearchEntry[];
        return entries.slice(0, limit);
      }

      const allEntries = await this.getSortedTrending(period);
      if (allEntries.length > 0) {
        await this.redisService.set(key, JSON.stringify(allEntries), SUGGESTIONS_CACHE_TTL);
      }

      return allEntries.slice(0, limit);
    } catch (err) {
      this.logger.error(`Failed to get trending searches: ${(err as Error).message}`);
      return [];
    }
  }

  private async getSortedTrending(period: 'daily' | 'weekly' | 'monthly'): Promise<TrendingSearchEntry[]> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const key = period === 'daily'
        ? `${this.DAILY_KEY}:${today}`
        : period === 'weekly'
          ? this.WEEKLY_KEY
          : this.MONTHLY_KEY;

      const data = await this.redisService.get(key);
      if (!data) return [];

      const entries = JSON.parse(data) as Record<string, number>;
      return Object.entries(entries)
        .map(([query, count]) => ({
          query,
          count,
          period,
        }))
        .sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  }

  private async incrementInRedis(key: string, query: string): Promise<string> {
    const existing = await this.redisService.get(key);
    const counts: Record<string, number> = existing ? JSON.parse(existing) : {};
    counts[query] = (counts[query] || 0) + 1;
    return JSON.stringify(counts);
  }

  private getPeriodKey(period: 'daily' | 'weekly' | 'monthly'): string {
    const today = new Date().toISOString().slice(0, 10);
    switch (period) {
      case 'daily':
        return `tradfind:trending:cached:daily:${today}`;
      case 'weekly':
        return 'tradfind:trending:cached:weekly';
      case 'monthly':
        return 'tradfind:trending:cached:monthly';
    }
  }
}
