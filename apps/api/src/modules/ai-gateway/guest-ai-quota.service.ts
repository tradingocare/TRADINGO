import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../../common/services/redis.service'

/**
 * Phase 3ZC — founder-approved guest/company-less AI quota.
 *
 * Policy (exact, do not reinterpret):
 * - 20 AI requests per trusted server-side IP per UTC calendar day.
 * - Every NEW AI operation attempt counts (success and failure alike).
 * - A successful replay of the SAME idempotencyKey consumes ZERO units.
 * - Company-owned callers NEVER enter this quota (enforced by the caller).
 * - Exhaustion surfaces as HTTP 429 (thrown by the caller, not here).
 *
 * Window semantics: FIXED UTC calendar day. The counter key embeds the UTC
 * date (`YYYY-MM-DD`), so rotation is implicit — at 00:00 UTC a new key is
 * used and the old key dies by its own TTL. There is no rolling-window
 * bookkeeping and no background cleanup.
 *
 * Atomicity: a single Lua script performs INCR + (EXPIRE on first use) +
 * limit-check + DECR-rollback. Concurrent requests each receive a distinct
 * INCR value, so exactly values 1..LIMIT are admitted — no boundary
 * overshoot, no separate lock, one Redis round trip.
 *
 * Redis outage: fail-OPEN (admit + warn). Availability of guest AI is
 * preserved when the counter is unreachable; the existing 30/min per-IP
 * throttle still bounds abuse during the outage. This matches the
 * codebase-wide graceful-degradation convention (RedisService itself
 * degrades to no-ops rather than throwing).
 */
@Injectable()
export class GuestAiQuotaService {
  private readonly logger = new Logger(GuestAiQuotaService.name)

  /** Founder-approved daily allowance per IP. */
  static readonly DAILY_LIMIT = 20

  /**
   * Atomic consume script.
   * KEYS[1] = quota key, ARGV[1] = limit, ARGV[2] = ttl seconds.
   * Returns 1 when admitted, 0 when over quota (count rolled back).
   */
  static readonly CONSUME_SCRIPT = [
    "local current = redis.call('INCR', KEYS[1])",
    'if current == 1 then redis.call(\'EXPIRE\', KEYS[1], ARGV[2]) end',
    'if current > tonumber(ARGV[1]) then redis.call(\'DECR\', KEYS[1]) return 0 end',
    'return 1',
  ].join('\n')

  constructor(private readonly redis: RedisService) {}

  /** UTC calendar-day stamp, e.g. `2026-10-02`. */
  static dayStamp(now: Date = new Date()): string {
    return now.toISOString().slice(0, 10)
  }

  /** Seconds until next UTC midnight — the counter TTL. Always (0, 86400]. */
  static secondsUntilUtcMidnight(now: Date = new Date()): number {
    const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    return Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1000))
  }

  /**
   * Namespaced, date-scoped, IP-scoped counter key.
   * Conceptually: `ai:guest-quota:{UTC-date}:{ip}`. The IP is sanitized to
   * key-safe characters; distinct IPs (v4/v6/loopback) never share a bucket.
   */
  static keyFor(ip: string, now: Date = new Date()): string {
    const safe = (ip || 'unknown').trim().replace(/[^A-Za-z0-9._:-]/g, '_').slice(0, 64) || 'unknown'
    return `ai:guest-quota:${GuestAiQuotaService.dayStamp(now)}:${safe}`
  }

  /**
   * Consume one quota unit for the given server-side IP.
   * Returns admission + remaining units + seconds until the window resets.
   * Never throws: Redis outage admits with `remaining: -1` (unknown).
   */
  async tryConsume(ip: string): Promise<{ admitted: boolean; remaining: number; resetAfterSec: number }> {
    const now = new Date()
    const resetAfterSec = GuestAiQuotaService.secondsUntilUtcMidnight(now)
    const failOpen = { admitted: true, remaining: -1, resetAfterSec }
    let client: Awaited<ReturnType<RedisService['getClient']>>
    try {
      client = await this.redis.getClient()
    } catch {
      client = null
    }
    if (!client) {
      this.logger.warn('Guest AI quota Redis unavailable — fail-open (admitted, uncounted)')
      return failOpen
    }
    try {
      const res = await client.eval(
        GuestAiQuotaService.CONSUME_SCRIPT,
        1,
        GuestAiQuotaService.keyFor(ip, now),
        String(GuestAiQuotaService.DAILY_LIMIT),
        String(resetAfterSec),
      )
      const admitted = Number(res) === 1
      if (!admitted) {
        return { admitted: false, remaining: 0, resetAfterSec }
      }
      // Exact remaining would need a second round trip; report conservatively
      // from the admitted side (caller only needs admitted/rejected + reset).
      const raw = await client.get(GuestAiQuotaService.keyFor(ip, now))
      const used = raw === null ? 1 : Number(raw)
      return {
        admitted: true,
        remaining: Math.max(0, GuestAiQuotaService.DAILY_LIMIT - (Number.isFinite(used) ? used : 1)),
        resetAfterSec,
      }
    } catch (err) {
      this.logger.warn(`Guest AI quota consume failed (${(err as Error).message}) — fail-open (admitted, uncounted)`)
      return failOpen
    }
  }
}
