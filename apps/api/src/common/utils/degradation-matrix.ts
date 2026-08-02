import { logger } from '../logger';

export enum DegradationLevel {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface DegradationAction {
  dependency: string;
  level: DegradationLevel;
  fallbackStrategy: 'cache' | 'default' | 'skip' | 'retry' | 'queue' | 'stale';
  fallbackValue: unknown;
  ttlMs?: number;
  description: string;
}

export const DEGRADATION_MATRIX: DegradationAction[] = [
  {
    dependency: 'razorpay',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'queue',
    fallbackValue: { queued: true, message: 'Payment queued for retry' },
    description: 'Payment processing queued for retry',
  },
  {
    dependency: 'ai-gateway',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'stale',
    fallbackValue: { cached: true, message: 'Returning cached AI response' },
    ttlMs: 300_000,
    description: 'Return cached AI response or degrade gracefully',
  },
  {
    dependency: 'opensearch',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'default',
    fallbackValue: { prisma: true, message: 'Falling back to Prisma LIKE search' },
    description: 'Fall back to Prisma LIKE search',
  },
  {
    dependency: 's3-storage',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'retry',
    fallbackValue: { skipped: true, message: 'S3 unavailable after retries' },
    description: 'Retry with exponential backoff, then skip',
  },
  {
    dependency: 'smtp-email',
    level: DegradationLevel.NONE,
    fallbackStrategy: 'queue',
    fallbackValue: { queued: true, message: 'Email queued for later delivery' },
    description: 'Queue email for later delivery',
  },
  {
    dependency: 'sms-gateway',
    level: DegradationLevel.NONE,
    fallbackStrategy: 'skip',
    fallbackValue: { skipped: true, message: 'SMS skipped' },
    description: 'Skip SMS, log warning',
  },
  {
    dependency: 'redis-cache',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'skip',
    fallbackValue: { skipped: true, message: 'Cache bypassed, direct DB query' },
    description: 'Bypass cache, direct DB query',
  },
  {
    dependency: 'clickhouse',
    level: DegradationLevel.NONE,
    fallbackStrategy: 'default',
    fallbackValue: { prisma: true, message: 'Falling back to Prisma aggregations' },
    description: 'Fall back to Prisma aggregations',
  },
  {
    dependency: 'openai',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'cache',
    fallbackValue: { cached: true, message: 'Returning cached AI response' },
    ttlMs: 300_000,
    description: 'Return cached AI response',
  },
  {
    dependency: 'maps-api',
    level: DegradationLevel.PARTIAL,
    fallbackStrategy: 'skip',
    fallbackValue: { skipped: true, message: 'Location enrichment skipped' },
    description: 'Skip location enrichment',
  },
];

const levelOverrides = new Map<string, DegradationLevel>();

export class DegradationMatrixService {
  getAction(dependency: string): DegradationAction {
    const override = levelOverrides.get(dependency);
    const entry = DEGRADATION_MATRIX.find((d) => d.dependency === dependency);

    if (!entry) {
      logger.warn({ dependency }, `Unknown dependency "${dependency}", returning UNAVAILABLE`);
      return {
        dependency,
        level: DegradationLevel.UNAVAILABLE,
        fallbackStrategy: 'skip',
        fallbackValue: null,
        description: `Unknown dependency "${dependency}"`,
      };
    }

    return override ? { ...entry, level: override } : entry;
  }

  getLevel(dependency: string): DegradationLevel {
    const override = levelOverrides.get(dependency);
    if (override) return override;
    const entry = DEGRADATION_MATRIX.find((d) => d.dependency === dependency);
    return entry?.level ?? DegradationLevel.UNAVAILABLE;
  }

  updateLevel(dependency: string, level: DegradationLevel): void {
    logger.info({ dependency, level }, `Degradation level updated for "${dependency}" -> ${level}`);
    levelOverrides.set(dependency, level);
  }

  getMatrix(): DegradationAction[] {
    return DEGRADATION_MATRIX.map((entry) => {
      const override = levelOverrides.get(entry.dependency);
      return override ? { ...entry, level: override } : entry;
    });
  }

  resetAll(): void {
    logger.info('Resetting all degradation levels to NONE');
    levelOverrides.clear();
  }
}

export async function executeWithDegradation<T>(
  dependency: string,
  fn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
): Promise<T> {
  const service = new DegradationMatrixService();
  const action = service.getAction(dependency);

  switch (action.level) {
    case DegradationLevel.NONE:
      return fn();

    case DegradationLevel.PARTIAL:
      logger.warn({ dependency }, `Degradation: ${dependency} is PARTIAL — executing with warning`);
      return fn().catch((error) => {
        logger.error({ error, dependency }, `Degradation: ${dependency} failed in PARTIAL mode`);
        return fallbackFn();
      });

    case DegradationLevel.DEGRADED:
      return fn().catch((error) => {
        logger.warn({ error, dependency }, `Degradation: ${dependency} failed in DEGRADED mode — using fallback`);
        return fallbackFn();
      });

    case DegradationLevel.UNAVAILABLE:
      logger.warn({ dependency, action }, `Degradation: ${dependency} is UNAVAILABLE — skipping, using fallback`);
      return fallbackFn();

    default:
      return fn();
  }
}

export default DegradationMatrixService;
