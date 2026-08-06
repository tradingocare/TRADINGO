import { Injectable, Logger } from '@nestjs/common';
import { Counter } from 'prom-client';
import { MetricsRegistryService } from './metrics-registry.service';
import { TimeoutError } from '../utils/timeout';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryableErrors?: Array<{ new (...args: any[]): Error }>;
  context?: string;
}

export const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors' | 'context'>> & {
  retryableErrors: RetryOptions['retryableErrors'];
  context: string;
} = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: [],
  context: 'default',
};

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN',
  'EPIPE',
  'EPROTO',
  'ECONNABORTED',
]);

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private counter: Counter<string> | null = null;
  private readonly retryCounters = new Map<string, number>();

  constructor(private readonly metricsRegistry: MetricsRegistryService) {}

  static createRetryOptions(overrides?: Partial<RetryOptions>): RetryOptions {
    return {
      ...DEFAULT_RETRY_OPTIONS,
      ...overrides,
    };
  }

  async executeWithRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const opts: Required<Omit<RetryOptions, 'retryableErrors'>> & { retryableErrors: NonNullable<RetryOptions['retryableErrors']> } = {
      maxRetries: options?.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries,
      baseDelayMs: options?.baseDelayMs ?? DEFAULT_RETRY_OPTIONS.baseDelayMs,
      maxDelayMs: options?.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs,
      exponentialBase: options?.exponentialBase ?? DEFAULT_RETRY_OPTIONS.exponentialBase,
      jitter: options?.jitter ?? DEFAULT_RETRY_OPTIONS.jitter,
      retryableErrors: options?.retryableErrors ?? [],
      context: options?.context ?? DEFAULT_RETRY_OPTIONS.context,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.recordMetric(opts.context, attempt + 1, true);
        this.retryCounters.delete(opts.context);
        return result;
      } catch (error) {
        lastError = error;
        this.recordMetric(opts.context, attempt + 1, false);

        if (attempt >= opts.maxRetries) {
          this.logger.warn({ context: opts.context, attempt: attempt + 1, maxRetries: opts.maxRetries, err: error }, `Retry exhausted for "${opts.context}"`);
          throw error;
        }

        if (!this.isRetryableError(error) && !this.isCustomRetryableError(error, opts.retryableErrors)) {
          this.logger.warn({ context: opts.context, attempt: attempt + 1, err: error }, `Non-retryable error for "${opts.context}" — aborting`);
          throw error;
        }

        const delay = this.calculateDelay(attempt + 1, opts);
        this.logger.warn(
          { context: opts.context, attempt: attempt + 1, nextDelayMs: delay, err: error },
          `Retry attempt ${attempt + 1}/${opts.maxRetries} for "${opts.context}" — waiting ${delay}ms`,
        );

        await sleep(delay);
      }
    }

    throw lastError;
  }

  isRetryableError(error: unknown): boolean {
    if (error instanceof TimeoutError) return true;

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      if (typeof err['code'] === 'string' && NETWORK_ERROR_CODES.has(err['code'])) return true;

      if (typeof err['statusCode'] === 'number' && (err['statusCode'] >= 500 || err['statusCode'] === 429)) return true;

      if (typeof err['status'] === 'number' && (err['status'] >= 500 || err['status'] === 429)) return true;
    }

    return false;
  }

  resetRetryCount(context: string): void {
    this.retryCounters.delete(context);
  }

  private isCustomRetryableError(error: unknown, retryableErrors: Array<{ new (...args: any[]): Error }>): boolean {
    if (retryableErrors.length === 0) return false;
    return retryableErrors.some((ErrorType) => error instanceof ErrorType);
  }

  private calculateDelay(attempt: number, opts: Required<Pick<RetryOptions, 'baseDelayMs' | 'maxDelayMs' | 'exponentialBase' | 'jitter'>>): number {
    const exponentialDelay = opts.baseDelayMs * Math.pow(opts.exponentialBase, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, opts.maxDelayMs);

    if (!opts.jitter) return clampedDelay;

    const jitterRange = clampedDelay * 0.3;
    const jitterOffset = Math.random() * jitterRange - jitterRange / 2;
    return Math.round(clampedDelay + jitterOffset);
  }

  private recordMetric(context: string, attempt: number, success: boolean): void {
    const counter = this.getOrCreateCounter();
    if (!counter) return;
    counter.inc({ context, attempt: String(attempt), success: String(success) });
  }

  private getOrCreateCounter(): Counter<string> | null {
    if (this.counter) return this.counter;
    if (!this.metricsRegistry.isReady) return null;

    this.counter = new Counter({
      name: 'retry_attempts_total',
      help: 'Total retry attempts with context, attempt number, and success/failure',
      labelNames: ['context', 'attempt', 'success'] as const,
      registers: [this.metricsRegistry.register],
    });

    return this.counter;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
