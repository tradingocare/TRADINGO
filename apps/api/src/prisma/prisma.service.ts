import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Histogram, Counter, Registry } from 'prom-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private queryDuration: Histogram<string> | null = null;
  private queryCounter: Counter<string> | null = null;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
        ...(process.env.NODE_ENV === 'development' ? [{ emit: 'event', level: 'query' } as const] : []),
      ],
    });

    // Warn on slow queries (>500ms in dev, >200ms in prod)
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        if (e.duration > 500) {
          this.logger.warn(`SLOW QUERY (${e.duration}ms): ${e.query?.substring(0, 200)}`);
        }
      });
    }
  }

  registerMetrics(register: Registry) {
    this.queryDuration = new Histogram({
      name: 'prisma_query_duration_seconds',
      help: 'Prisma query duration in seconds',
      labelNames: ['model', 'action'] as const,
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [register],
    });
    this.queryCounter = new Counter({
      name: 'prisma_queries_total',
      help: 'Total Prisma queries',
      labelNames: ['model', 'action'] as const,
      registers: [register],
    });
    (this as any).$on('query', (e: any) => {
      const model = this.extractModel(e.query) || 'unknown';
      const action = e.query?.startsWith('SELECT') ? 'select' : e.query?.startsWith('INSERT') ? 'create' : e.query?.startsWith('UPDATE') ? 'update' : e.query?.startsWith('DELETE') ? 'delete' : 'other';
      this.queryDuration?.observe({ model, action }, e.duration / 1000);
      this.queryCounter?.inc({ model, action });
    });
  }

  private extractModel(query: string | undefined): string | null {
    if (!query) return null;
    // Match table name after FROM/JOIN/UPDATE/INSERT INTO/DELETE FROM — handles quoted and unquoted names
    const match = query.match(/(?:FROM|JOIN|UPDATE|INTO|FROM\s+ONLY)\s+["']?(\w+)/i);
    return match ? match[1] : null;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Connected to PostgreSQL (query logging: ${process.env.NODE_ENV === 'development' ? 'enabled' : 'warn+error only'})`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
