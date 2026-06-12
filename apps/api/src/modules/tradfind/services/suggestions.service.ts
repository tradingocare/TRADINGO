import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { TrendingSearchService } from './trending-search.service';
import { SearchSuggestion } from '../interfaces/search-types';
import { SUGGESTIONS_CACHE_TTL } from '../enums/search.enums';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly CACHE_KEY = 'tradfind:suggestions';

  constructor(
    private readonly redisService: RedisService,
    private readonly trendingSearchService: TrendingSearchService,
  ) {}

  async getSuggestions(limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      const cached = await this.redisService.get(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as SearchSuggestion[];
      }
    } catch {
      this.logger.warn('Failed to read suggestions from cache');
    }

    const suggestions = await this.generateSuggestions(limit);

    try {
      await this.redisService.set(this.CACHE_KEY, JSON.stringify(suggestions), SUGGESTIONS_CACHE_TTL);
    } catch {
      this.logger.warn('Failed to cache suggestions');
    }

    return suggestions;
  }

  async invalidateCache(): Promise<void> {
    try {
      await this.redisService.del(this.CACHE_KEY);
    } catch {
      this.logger.warn('Failed to invalidate suggestions cache');
    }
  }

  private async generateSuggestions(limit: number): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    try {
      const trending = await this.trendingSearchService.getTrendingSearches(limit);
      for (const t of trending) {
        suggestions.push({ query: t.query, count: t.count });
      }
    } catch {
      this.logger.warn('Failed to fetch trending for suggestions');
    }

    return suggestions.slice(0, limit);
  }
}
