import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

const THROTTLER_KEY_PREFIX = 'throttler:';

@Injectable()
export class RedisThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redisService: RedisService) {}

  async increment(key: string, ttlMs: number, limit: number, blockDuration: number, throttlerName: string): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    try {
      const redisKey = `${THROTTLER_KEY_PREFIX}${throttlerName}:${key}`;
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      const count = await this.redisService.incr(redisKey);
      if (count === 1) await this.redisService.expire(redisKey, ttlSeconds);

      const remainingTtl = await this.redisService.ttl(redisKey);

      const isBlocked = count > limit;
      const blockSeconds = Math.ceil(blockDuration / 1000);
      // Only apply a hard block window when one is configured. blockDuration=0
      // (default in app.module.ts) means "block until the TTL window expires".
      // Calling EXPIRE with 0 seconds would DELETE the key, silently resetting
      // the counter and defeating rate limiting entirely.
      if (isBlocked && count === limit + 1 && blockSeconds > 0) {
        await this.redisService.expire(redisKey, blockSeconds);
      }
      const blockRemaining = isBlocked && blockSeconds > 0 ? (await this.redisService.ttl(redisKey)) * 1000 : 0;

      return {
        totalHits: count,
        timeToExpire: remainingTtl > 0 ? remainingTtl * 1000 : ttlMs,
        isBlocked,
        timeToBlockExpire: blockRemaining,
      };
    } catch (err) {
      this.logger.warn(`Redis throttler storage failed, allowing request: ${(err as Error).message}`);
      return { totalHits: 1, timeToExpire: ttlMs, isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}