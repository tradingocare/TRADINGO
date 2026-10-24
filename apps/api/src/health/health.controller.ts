import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { ClickhouseService } from '../modules/analytics/clickhouse.service';
import { StorageService } from '../modules/storage/storage.service';
import { SearchService } from '../modules/search/search.service';
import { ProductionConfigValidator } from '../common/services/production-config-validator.service';

interface BackendCheck {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

const DIAGNOSTIC_TIMEOUT_MS = 2000;

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly clickhouse: ClickhouseService,
    private readonly storage: StorageService,
    private readonly searchService: SearchService,
    private readonly configService: ConfigService,
    private readonly validator: ProductionConfigValidator,
  ) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    // Fastify-compatible: return a plain object and let the framework
    // serialize it (the prior Express-style res.status().json() throws
    // under the Fastify adapter). Payload keys preserved verbatim.
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (err: any) {
      return { status: 'error', database: 'unreachable', message: err?.message || 'unknown' };
    }
  }

  @Public()
  @Get('health')
  async check() {
    const checks: Record<string, BackendCheck> = {};
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      checks.database = { status: 'down', error: err?.message || 'unreachable' };
    }
    return {
      status: checks.database.status === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Public()
  @Get('health/diagnostics')
  async diagnostics() {
    const [db, redis, opensearch, clickhouse, storage] = await Promise.all([
      this.runCheck('database', () => this.prisma.$queryRaw`SELECT 1`),
      this.runRedisCheck(),
      this.runCheck('opensearch', () => this.searchService.ping(), (v: boolean) => v),
      this.runCheck('clickhouse', () => this.clickhouse.ping(), (v: boolean) => v),
      this.runCheck('storage', () => this.storage.check(), (v: boolean) => v),
    ]);

    const checks: Record<string, BackendCheck> = {
      database: db,
      redis,
      opensearch,
      clickhouse,
      storage,
    };

    const allUp = Object.values(checks).every((c) => c.status === 'up');
    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('config-status')
  getConfigStatus() {
    const result = this.validator.validate(
      this.configService,
      process.env.NODE_ENV === 'production',
    );
    return {
      paymentMode: result.paymentMode,
      isProduction: result.isProduction,
      errors: result.errors,
      warnings: result.warnings,
      report: result.report,
    };
  }

  private async runCheck(
    name: string,
    fn: () => Promise<unknown>,
    isUp: (value: unknown) => boolean = (v) => v !== undefined && v !== false,
  ): Promise<BackendCheck> {
    const t0 = Date.now();
    try {
      const value = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), DIAGNOSTIC_TIMEOUT_MS),
        ),
      ]);
      return { status: isUp(value) ? 'up' : 'down', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { status: 'down', latencyMs: Date.now() - t0, error: err?.message || 'unreachable' };
    }
  }

  private async runRedisCheck(): Promise<BackendCheck> {
    const t0 = Date.now();
    try {
      const client = await Promise.race([
        this.redis.getClient(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), DIAGNOSTIC_TIMEOUT_MS),
        ),
      ]);
      if (!client) return { status: 'down', error: 'redis not configured', latencyMs: Date.now() - t0 };
      const pong = await client.ping();
      return { status: pong === 'PONG' ? 'up' : 'down', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { status: 'down', error: err?.message || 'unreachable', latencyMs: Date.now() - t0 };
    }
  }
}
