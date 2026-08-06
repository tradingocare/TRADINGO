import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../../../common/logger';

export function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  try {
    const expected = generateSignature(payload, secret);
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Payment signature verification failed');
    return false;
  }
}

export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
  return `${prefix}_${parts.join('_')}_${Date.now()}`;
}
