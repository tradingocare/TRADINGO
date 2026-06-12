import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RecentSearchEntry } from '../interfaces/search-types';
import { RECENT_SEARCHES_LIMIT, SUGGESTIONS_CACHE_TTL } from '../enums/search.enums';

@Injectable()
export class RecentSearchService {
  private readonly logger = new Logger(RecentSearchService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async addSearch(userId: string, query: string): Promise<void> {
    const redisKey = this.getRedisKey(userId);

    try {
      const entry: RecentSearchEntry = { userId, query, timestamp: new Date() };

      const redisEntry = JSON.stringify(entry);
      await this.redisService.set(
        `${redisKey}:${Date.now()}`,
        redisEntry,
        SUGGESTIONS_CACHE_TTL,
      );

      const existing = await this.getRecentSearches(userId);
      const updated = [entry, ...existing.filter((e) => e.query !== query)].slice(
        0,
        RECENT_SEARCHES_LIMIT,
      );
      await this.redisService.set(redisKey, JSON.stringify(updated), SUGGESTIONS_CACHE_TTL);

      try {
        await this.prisma.recentSearch.create({
          data: { userId, query, timestamp: new Date() },
        });
      } catch {
        this.logger.warn('Failed to persist recent search to DB');
      }
    } catch (err) {
      this.logger.error(`Failed to add recent search: ${(err as Error).message}`);
    }
  }

  async getRecentSearches(userId: string, limit: number = 10): Promise<RecentSearchEntry[]> {
    try {
      const cached = await this.redisService.get(this.getRedisKey(userId));
      if (cached) {
        return (JSON.parse(cached) as RecentSearchEntry[]).slice(0, limit);
      }
    } catch {
      this.logger.warn('Failed to read recent searches from cache');
    }

    try {
      const dbSearches = await this.prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      const entries: RecentSearchEntry[] = dbSearches.map((s) => ({
        id: s.id,
        userId: s.userId,
        query: s.query,
        timestamp: s.timestamp,
      }));

      await this.redisService.set(
        this.getRedisKey(userId),
        JSON.stringify(entries),
        SUGGESTIONS_CACHE_TTL,
      );

      return entries;
    } catch (err) {
      this.logger.error(`Failed to fetch recent searches: ${(err as Error).message}`);
      return [];
    }
  }

  async deleteSearch(userId: string, searchId?: string): Promise<void> {
    try {
      await this.redisService.del(this.getRedisKey(userId));

      if (searchId) {
        await this.prisma.recentSearch.deleteMany({
          where: { id: searchId, userId },
        });
      } else {
        await this.prisma.recentSearch.deleteMany({
          where: { userId },
        });
      }
    } catch (err) {
      this.logger.error(`Failed to delete recent searches: ${(err as Error).message}`);
    }
  }

  private getRedisKey(userId: string): string {
    return `tradfind:recent:${userId}`;
  }
}
