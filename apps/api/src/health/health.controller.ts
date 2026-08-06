import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ClickhouseService } from '../modules/analytics/clickhouse.service';
import { StorageService } from '../modules/storage/storage.service';

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly clickhouse: ClickhouseService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    const prismaPing = await this.pingPrisma();
    return {
      status: prismaPing.status === 'up' ? 'ok' : 'error',
      checks: { database: prismaPing },
    };
  }

  @Public()
  @Get('health')
  async check() {
    const prismaPing = await this.pingPrisma();
    return {
      status: prismaPing.status === 'up' ? 'ok' : 'degraded',
      checks: { database: prismaPing },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/diagnostics')
  async diagnostics() {
    const [prismaPing, redisPing, osPing, clickhousePing, storagePing] = await Promise.allSettled([
      this.pingPrisma(),
      this.pingRedis(),
      this.pingOpenSearch(),
      this.pingClickHouse(),
      this.pingStorage(),
    ]);
    const checks = {
      database: prismaPing.status === 'fulfilled' ? prismaPing.value : { status: 'down', message: 'Prisma ping rejected' },
      redis: redisPing.status === 'fulfilled' ? redisPing.value : { status: 'down', message: 'Redis ping rejected' },
      opensearch: osPing.status === 'fulfilled' ? osPing.value : { status: 'down', message: 'OpenSearch ping rejected' },
      clickhouse: clickhousePing.status === 'fulfilled' ? clickhousePing.value : { status: 'down', message: 'ClickHouse ping rejected' },
      storage: storagePing.status === 'fulfilled' ? storagePing.value : { status: 'down', message: 'Storage ping rejected' },
    };
    const allUp = Object.values(checks).every((c) => c.status === 'up');
    return { status: allUp ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() };
  }

  private async pingPrisma(): Promise<{ status: string; message?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch {
      return { status: 'down', message: 'Database ping failed' };
    }
  }

  private async pingRedis(): Promise<{ status: string; message?: string }> {
    try {
      const client = (this.redis as any).client ?? this.redis as any;
      if (typeof client.ping === 'function') {
        await client.ping();
        return { status: 'up' };
      }
      return { status: 'down', message: 'Redis client not available' };
    } catch {
      return { status: 'down', message: 'Redis ping failed' };
    }
  }

  private async pingOpenSearch(): Promise<{ status: string; message?: string }> {
    try {
      const res = await fetch(process.env.OPENSEARCH_URL || 'https://localhost:9200', {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok ? { status: 'up' } : { status: 'down', message: 'OpenSearch unreachable' };
    } catch {
      return { status: 'down', message: 'OpenSearch connection failed' };
    }
  }

  private async pingClickHouse(): Promise<{ status: string; message?: string }> {
    try {
      const result = await Promise.race([
        this.clickhouse.ping(),
        new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);
      return result ? { status: 'up' } : { status: 'down', message: 'ClickHouse ping returned false' };
    } catch {
      return { status: 'down', message: 'ClickHouse connection failed or timed out' };
    }
  }

  private async pingStorage(): Promise<{ status: string; message?: string }> {
    try {
      const ok = await Promise.race([
        this.storage.check(),
        new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);
      return ok ? { status: 'up' } : { status: 'down', message: 'Storage check returned false' };
    } catch {
      return { status: 'down', message: 'Storage connection failed or timed out' };
    }
  }
}
