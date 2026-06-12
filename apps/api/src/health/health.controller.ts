import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma as unknown as Parameters<PrismaHealthIndicator['pingCheck']>[1]),
      () => {
        const redisClient = this.redis as unknown as { client: { ping(): Promise<string> } };
        return redisClient.client.ping().then(
          () => ({ redis: { status: 'up' as const } }) as HealthIndicatorResult,
          () => ({ redis: { status: 'down' as const, message: 'Redis ping failed' } }) as HealthIndicatorResult,
        );
      },
      () =>
        fetch(`${process.env.OPENSEARCH_URL || 'https://localhost:9200'}/_cluster/health`)
          .then(
            (res) => (res.ok ? ({ opensearch: { status: 'up' as const } }) : Promise.reject()),
            () => Promise.reject(),
          )
          .catch(() => ({ opensearch: { status: 'down' as const, message: 'OpenSearch unreachable' } } as HealthIndicatorResult)),
    ]);
  }
}
