import { logger } from '../logger';

export class TimeoutError extends Error {
  public readonly context: string;
  public readonly durationMs: number;

  constructor(context: string, durationMs: number) {
    super(`Operation "${context}" timed out after ${durationMs}ms`);
    this.name = 'TimeoutError';
    this.context = context;
    this.durationMs = durationMs;
  }
}

export const DEFAULT_TIMEOUTS = {
  razorpay: 15000,
  ai: 30000,
  opensearch: 10000,
  s3: 10000,
  sms: 5000,
  email: 5000,
  smtp: 10000,
  webhook: 10000,
  redis: 3000,
  database: 10000,
} as const satisfies Record<string, number>;

export function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new TimeoutError(context, ms);
      logger.warn({ context, durationMs: ms }, `Timeout in ${context}`);
      reject(err);
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number },
  context: string,
): Promise<Response> {
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUTS.ai;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new TimeoutError(context, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
