import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.service'
import { QueueNames } from '../../jobs/queues'
import { AiCircuitBreakerService } from './ai-circuit-breaker.service'
import { AiSlaEngineService } from './ai-sla-engine.service'
import { AiObservabilityService } from '../ai-orchestrator/ai-observability.service'
import { TelemetrySnapshot } from './dto/ai-runtime.dto'
import { UsageTrackerService } from '../ai-gateway/usage-tracker.service'

@Injectable()
export class AiTelemetryService {
  private readonly logger = new Logger(AiTelemetryService.name)
  private readonly errorCounts = new Map<string, number>()
  private workerUtilizationPct = 0
  private lastSampleTime = Date.now()
  private lastActiveJobs = 0

  constructor(
    @InjectQueue(QueueNames.AI) private readonly aiQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly circuitBreaker: AiCircuitBreakerService,
    private readonly slaEngine: AiSlaEngineService,
    private readonly observability: AiObservabilityService,
    private readonly usageTracker: UsageTrackerService,
  ) {}

  recordError(errorMessage: string): void {
    const key = this.normalizeError(errorMessage)
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
  }

  private normalizeError(msg: string): string {
    if (msg.includes('timeout') || msg.includes('Timeout')) return 'Timeout'
    if (msg.includes('rate limit') || msg.includes('429')) return 'Rate Limit'
    if (msg.includes('auth') || msg.includes('401') || msg.includes('403')) return 'Authentication'
    if (msg.includes('credit') || msg.includes('402')) return 'Insufficient Credits'
    if (msg.includes('network') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) return 'Network Error'
    if (msg.includes('circuit') || msg.includes('Circuit')) return 'Circuit Open'
    return msg.substring(0, 100)
  }

  async getSnapshot(): Promise<TelemetrySnapshot> {
    const queueCounts = await this.aiQueue.getJobCounts()
    const queueDepth = (queueCounts.waiting || 0) + (queueCounts.active || 0)
    const circuitSummary = this.circuitBreaker.getSummary()
    const slaSummary = this.slaEngine.getSummary()

    const now = Date.now()
    if (now - this.lastSampleTime > 5000) {
      const activeDelta = (queueCounts.active || 0) - this.lastActiveJobs
      this.workerUtilizationPct = Math.max(0, Math.min(100, 50 + activeDelta * 10))
      this.lastActiveJobs = queueCounts.active || 0
      this.lastSampleTime = now
    }

    const topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }))

    const stats = this.observability.getStats()
    const avgLatency = stats.avgLatency || 0

    const slaStatuses = this.slaEngine.getAllStatuses()
    const allLatencies: number[] = []
    for (const s of slaStatuses) {
      if (s.p95LatencyMs > 0) allLatencies.push(s.p95LatencyMs)
    }
    allLatencies.sort((a, b) => a - b)
    const p95 = allLatencies.length > 0
      ? allLatencies[Math.floor(allLatencies.length * 0.95)]
      : 0
    const p99 = allLatencies.length > 0
      ? allLatencies[Math.floor(allLatencies.length * 0.99)]
      : 0

    return {
      queueDepth,
      activeWorkers: queueCounts.active || 0,
      waitingJobs: queueCounts.waiting || 0,
      completedJobs24h: queueCounts.completed || 0,
      failedJobs24h: queueCounts.failed || 0,
      avgLatencyMs24h: avgLatency,
      p95LatencyMs24h: p95,
      p99LatencyMs24h: p99,
      circuitBreakers: circuitSummary,
      slaBreaches24h: slaSummary.totalBreaches,
      topErrors,
      workerUtilizationPct: this.workerUtilizationPct,
      timestamp: new Date().toISOString(),
    }
  }

  async getDetailedProviderStats() {
    return this.prisma.aiProvider.findMany({
      orderBy: { priority: 'asc' },
      select: {
        name: true, displayName: true, providerType: true,
        healthStatus: true, enabled: true, priority: true,
        failureCount: true, circuitOpen: true, lastSuccessAt: true, lastFailureAt: true,
        lastHealthCheckAt: true,
      },
    })
  }
}
