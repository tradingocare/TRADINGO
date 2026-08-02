import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/services/redis.service'
import { CircuitBreakerStatus, StreamingEvent } from './dto/ai-runtime.dto'

interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  totalRequestCount: number
  failureRateThreshold: number
  minimumFailures: number
  recoveryTimeoutMs: number
  halfOpenMaxRequests: number
  halfOpenRequests: number
  openedAt: number | null
  lastFailureAt: number | null
  lastSuccessAt: number | null
}

const DEFAULT_CONFIG = {
  failureRateThreshold: 0.5,
  minimumFailures: 3,
  recoveryTimeoutMs: 30000,
  halfOpenMaxRequests: 5,
}

@Injectable()
export class AiCircuitBreakerService {
  private readonly logger = new Logger(AiCircuitBreakerService.name)
  private readonly states = new Map<string, CircuitState>()
  private readonly perActionConfigs = new Map<string, Partial<typeof DEFAULT_CONFIG>>()
  private readonly redisPrefix = 'circuit:'

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOrCreateState(key: string, actionId?: string): Promise<CircuitState> {
    let state = this.states.get(key)
    if (!state) {
      const fromRedis = await this.redis.get(`${this.redisPrefix}${key}`)
      if (fromRedis) {
        state = JSON.parse(fromRedis) as CircuitState
      } else {
        const override = this.perActionConfigs.get(actionId || key)
        state = {
          state: 'CLOSED',
          failureCount: 0,
          totalRequestCount: 0,
          failureRateThreshold: override?.failureRateThreshold ?? DEFAULT_CONFIG.failureRateThreshold,
          minimumFailures: override?.minimumFailures ?? DEFAULT_CONFIG.minimumFailures,
          recoveryTimeoutMs: override?.recoveryTimeoutMs ?? DEFAULT_CONFIG.recoveryTimeoutMs,
          halfOpenMaxRequests: override?.halfOpenMaxRequests ?? DEFAULT_CONFIG.halfOpenMaxRequests,
          halfOpenRequests: 0,
          openedAt: null,
          lastFailureAt: null,
          lastSuccessAt: null,
        }
      }
      this.states.set(key, state)
    }
    return state
  }

  private async persist(key: string, state: CircuitState): Promise<void> {
    await this.redis.set(`${this.redisPrefix}${key}`, JSON.stringify(state), 300)
  }

  async setPerActionConfig(actionId: string, config: Partial<typeof DEFAULT_CONFIG>): Promise<void> {
    this.perActionConfigs.set(actionId, config)
  }

  async isOpen(key: string, actionId?: string): Promise<boolean> {
    const state = await this.getOrCreateState(key, actionId)
    if (state.state === 'CLOSED') return false
    if (state.state === 'OPEN') {
      if (state.openedAt && Date.now() - state.openedAt >= state.recoveryTimeoutMs) {
        state.state = 'HALF_OPEN'
        state.halfOpenRequests = 0
        this.persist(key, state)
        this.logger.log(`Circuit '${key}' transitioned to HALF_OPEN`)
        this.emitEvent({ type: 'circuit_opened', data: { key, state: 'HALF_OPEN' } } as any)
        return false
      }
      return true
    }
    if (state.halfOpenRequests >= state.halfOpenMaxRequests) return true
    return false
  }

  async onSuccess(key: string): Promise<void> {
    const state = await this.getOrCreateState(key)
    state.totalRequestCount++
    state.failureCount = 0
    state.lastSuccessAt = Date.now()
    if (state.state === 'HALF_OPEN') {
      state.state = 'CLOSED'
      state.openedAt = null
      this.logger.log(`Circuit '${key}' closed after successful half-open request`)
      this.emitEvent({ type: 'circuit_closed', data: { key } } as any)
    }
    state.halfOpenRequests = 0
    this.persist(key, state)
  }

  async onFailure(key: string, actionId?: string): Promise<void> {
    const state = await this.getOrCreateState(key, actionId)
    state.totalRequestCount++
    state.failureCount++
    state.lastFailureAt = Date.now()

    const failureRate = state.totalRequestCount > 0
      ? state.failureCount / state.totalRequestCount
      : 0
    const shouldTrip = state.failureCount >= state.minimumFailures
      && failureRate >= state.failureRateThreshold

    if (state.state === 'HALF_OPEN') {
      state.state = 'OPEN'
      state.openedAt = Date.now()
      state.halfOpenRequests = 0
      this.logger.warn(`Circuit '${key}' re-opened after half-open failure (rate: ${(failureRate * 100).toFixed(1)}%)`)
      this.emitEvent({ type: 'circuit_opened', data: { key, state: 'OPEN' } } as any)
    } else if (state.state === 'CLOSED' && shouldTrip) {
      state.state = 'OPEN'
      state.openedAt = Date.now()
      this.logger.warn(`Circuit '${key}' opened (${state.failureCount}/${state.totalRequestCount} failures, rate: ${(failureRate * 100).toFixed(1)}%)`)
      this.emitEvent({ type: 'circuit_opened', data: { key, state: 'OPEN' } } as any)
    }

    this.persist(key, state)
  }

  async getAllStatuses(): Promise<CircuitBreakerStatus[]> {
    const statuses: CircuitBreakerStatus[] = []
    for (const [key, state] of this.states.entries()) {
      const cooldownRemainingMs = state.openedAt
        ? Math.max(0, state.recoveryTimeoutMs - (Date.now() - state.openedAt))
        : 0
      statuses.push({
        providerName: key.startsWith('provider:') ? key.replace('provider:', '') : undefined,
        actionId: key.startsWith('action:') ? key.replace('action:', '') : undefined,
        state: state.state,
        failureCount: state.failureCount,
        totalRequestCount: state.totalRequestCount,
        failureRateThreshold: state.failureRateThreshold,
        minimumFailures: state.minimumFailures,
        recoveryTimeoutMs: state.recoveryTimeoutMs,
        halfOpenMaxRequests: state.halfOpenMaxRequests,
        halfOpenRequests: state.halfOpenRequests,
        failureRate: state.totalRequestCount > 0 ? state.failureCount / state.totalRequestCount : 0,
        openedAt: state.openedAt ? new Date(state.openedAt).toISOString() : undefined,
        lastFailureAt: state.lastFailureAt ? new Date(state.lastFailureAt).toISOString() : undefined,
        lastSuccessAt: state.lastSuccessAt ? new Date(state.lastSuccessAt).toISOString() : undefined,
        cooldownRemainingMs,
      })
    }
    return statuses
  }

  async reset(key: string): Promise<void> {
    this.states.delete(key)
    await this.redis.del(`${this.redisPrefix}${key}`)
    this.logger.log(`Circuit '${key}' manually reset`)
  }

  async resetAll(): Promise<void> {
    const keys = Array.from(this.states.keys())
    this.states.clear()
    for (const key of keys) {
      await this.redis.del(`${this.redisPrefix}${key}`)
    }
    this.logger.log(`All circuits reset (${keys.length} keys)`)
  }

  getSummary(): { closed: number; open: number; halfOpen: number } {
    let closed = 0; let open = 0; let halfOpen = 0
    for (const s of this.states.values()) {
      if (s.state === 'CLOSED') closed++
      else if (s.state === 'OPEN') open++
      else halfOpen++
    }
    return { closed, open, halfOpen }
  }

  private emitEvent(event: StreamingEvent): void {
    try { this.eventEmitter.emit('ai-runtime.event', event) } catch {
      this.logger.error(`Failed to emit circuit breaker event: ${event.type}`);
    }
  }
}
