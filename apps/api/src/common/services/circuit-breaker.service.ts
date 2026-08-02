import { Injectable, Logger } from '@nestjs/common';
import { Gauge } from 'prom-client';
import { withTimeout } from '../utils/timeout';
import { MetricsRegistryService } from './metrics-registry.service';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
  timeoutMs?: number;
  context: string;
}

export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 3,
  openTimeoutMs: 30000,
  context: 'unnamed',
};

export class CircuitBreakerOpenError extends Error {
  public readonly context: string;

  constructor(context: string) {
    super(`Circuit breaker "${context}" is OPEN`);
    this.name = 'CircuitBreakerOpenError';
    this.context = context;
  }
}

export interface CircuitBreakerStateInfo {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

class CircuitBreaker {
  public state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  public failureCount = 0;
  public successCount = 0;
  public lastFailureTime: number | null = null;
  public lastSuccessTime: number | null = null;

  private readonly options: CircuitBreakerOptions;
  private readonly logger: Logger;

  constructor(private readonly name: string, options?: Partial<CircuitBreakerOptions>) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options, context: name };
    this.logger = new Logger(`CircuitBreaker:${name}`);
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const from = this.state;
    this.state = newState;
    this.logger.warn({ from, to: newState, name: this.name }, `Circuit breaker "${this.name}" transitioned ${from} → ${newState}`);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      const elapsed = this.lastFailureTime !== null ? Date.now() - this.lastFailureTime : Infinity;
      if (elapsed >= this.options.openTimeoutMs) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
        this.successCount = 0;
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    const run = () => {
      const promise = fn();
      return this.options.timeoutMs !== undefined
        ? withTimeout(promise, this.options.timeoutMs!, this.options.context)
        : promise;
    };

    try {
      const result = await run();
      this.onSuccess();
      return result;
    } catch (err) {
      if (err instanceof CircuitBreakerOpenError) {
        throw err;
      }
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN && this.successCount >= this.options.successThreshold) {
      this.failureCount = 0;
      this.transitionTo(CircuitBreakerState.CLOSED);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.OPEN);
    } else if (this.state === CircuitBreakerState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.transitionTo(CircuitBreakerState.OPEN);
    }
  }

  getInfo(): CircuitBreakerStateInfo {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }
}

@Injectable()
export class CircuitBreakerRegistry {
  private readonly logger = new Logger(CircuitBreakerRegistry.name);
  private readonly breakers = new Map<string, CircuitBreaker>();
  private gauge: Gauge<string> | null = null;

  constructor(private readonly registry: MetricsRegistryService) {
    this.ensureGauge();
  }

  private ensureGauge(): void {
    if (!this.registry.isReady) {
      setTimeout(() => this.ensureGauge(), 3000);
      return;
    }
    this.gauge = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Current state of circuit breakers (1 for active state, 0 for others)',
      labelNames: ['name', 'state'],
      registers: [this.registry.register],
    });
  }

  getOrCreate(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    let cb = this.breakers.get(name);
    if (!cb) {
      cb = new CircuitBreaker(name, options);
      this.breakers.set(name, cb);
      this.logger.log(`Circuit breaker "${name}" created`);
    }
    this.updateMetrics(name, cb);
    return cb;
  }

  private updateMetrics(name: string, cb: CircuitBreaker): void {
    if (!this.gauge) return;
    const states = [CircuitBreakerState.CLOSED, CircuitBreakerState.OPEN, CircuitBreakerState.HALF_OPEN];
    for (const s of states) {
      this.gauge.set({ name, state: s }, s === cb.state ? 1 : 0);
    }
  }

  getAll(): Map<string, CircuitBreakerStateInfo> {
    const result = new Map<string, CircuitBreakerStateInfo>();
    for (const [name, cb] of this.breakers) {
      result.set(name, cb.getInfo());
      this.updateMetrics(name, cb);
    }
    return result;
  }

  reset(name: string): void {
    const cb = this.breakers.get(name);
    if (cb) {
      cb.state = CircuitBreakerState.CLOSED;
      cb.failureCount = 0;
      cb.successCount = 0;
      cb.lastFailureTime = null;
      cb.lastSuccessTime = null;
      this.logger.warn({ name }, `Circuit breaker "${name}" reset`);
      this.updateMetrics(name, cb);
    }
  }

  resetAll(): void {
    for (const [name] of this.breakers) {
      this.reset(name);
    }
  }
}
