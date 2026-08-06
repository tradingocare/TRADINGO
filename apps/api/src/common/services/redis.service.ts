import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Counter, Registry } from 'prom-client';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private cacheHits: Counter<string> | null = null;
  private cacheMisses: Counter<string> | null = null;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    this.client = redisUrl ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 500, 5000);
      },
      enableReadyCheck: false,
      lazyConnect: true,
      enableOfflineQueue: true,
    }) : null as unknown as Redis;

    if (this.client) {
      this.client.on('error', (err) => this.logger.warn(`Redis unavailable: ${(err as Error).message}`));
      this.client.on('ready', () => this.logger.log('Redis connection ready'));
      this.client.connect().catch((err) => this.logger.warn(`Redis connect failed, running without cache: ${(err as Error).message}`));
    } else {
      this.logger.warn('REDIS_URL not configured, running without cache');
    }
  }

  registerMetrics(register: Registry) {
    this.cacheHits = new Counter({
      name: 'redis_cache_hits_total',
      help: 'Total Redis cache hits',
      labelNames: ['key_pattern'] as const,
      registers: [register],
    });
    this.cacheMisses = new Counter({
      name: 'redis_cache_misses_total',
      help: 'Total Redis cache misses',
      labelNames: ['key_pattern'] as const,
      registers: [register],
    });
  }

  private keyPattern(key: string): string {
    // Extract pattern from key e.g. "founder:morning-brief:comp_123" → "founder:morning-brief"
    const parts = key.split(':');
    return parts.length > 2 ? parts.slice(0, -1).join(':') : parts[0];
  }

  private isAvailable(): boolean {
    return this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.cacheHits?.inc({ key_pattern: this.keyPattern(key) });
      } else {
        this.cacheMisses?.inc({ key_pattern: this.keyPattern(key) });
      }
      return value;
    } catch { return null; }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch { /* gracefully degrade */ }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try { await this.client.del(key); } catch { /* gracefully degrade */ }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length > 0) await this.client.del(...keys);
        cursor = nextCursor;
      } while (cursor !== '0');
    } catch { /* gracefully degrade */ }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    try { return this.client.incr(key); } catch { return 0; }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable()) return;
    try { await this.client.expire(key, ttlSeconds); } catch { /* gracefully degrade */ }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch { return false; }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) return -1;
    try { return this.client.ttl(key); } catch { return -1; }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isAvailable()) return keys.map(() => null);
    try { return this.client.mget(...keys); } catch { return keys.map(() => null); }
  }

  async mset(keyValues: Record<string, string>, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const pipeline = this.client.pipeline();
      for (const [key, value] of Object.entries(keyValues)) {
        if (ttlSeconds) {
          pipeline.set(key, value, 'EX', ttlSeconds);
        } else {
          pipeline.set(key, value);
        }
      }
      await pipeline.exec();
    } catch { /* gracefully degrade */ }
  }

  async acquireLock(lockKey: string, ttlSeconds = 10): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const result = await this.client.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch { return false; }
  }

  async releaseLock(lockKey: string): Promise<void> {
    if (!this.isAvailable()) return;
    try { await this.client.del(lockKey); } catch { /* gracefully degrade */ }
  }

  async withLock<T>(lockKey: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquireLock(lockKey, ttlSeconds);
    if (!acquired) {
      throw new Error(`Lock acquisition failed: ${lockKey}`);
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  async getClient(): Promise<Redis | null> {
    return this.client;
  }

  onModuleDestroy() {
    if (this.client) {
      try { this.client.disconnect(); } catch { /* ignore */ }
    }
  }
}
