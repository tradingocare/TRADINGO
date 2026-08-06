import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { NotificationType, NotificationPriority } from '@prisma/client'
import { SlaStatus, StreamingEvent } from './dto/ai-runtime.dto'

interface SlaConfig {
  p50TargetMs: number
  p95TargetMs: number
  p99TargetMs: number
  alertThresholdMs: number
}

interface SlaSnapshot {
  totalRequests: number
  latencies: number[]
  sortedLatencies: number[] | null
  breaches: number
  lastAlertAt: number | null
}

const DEFAULT_SLA: SlaConfig = {
  p50TargetMs: 5000,
  p95TargetMs: 15000,
  p99TargetMs: 30000,
  alertThresholdMs: 20000,
}

@Injectable()
export class AiSlaEngineService {
  private readonly logger = new Logger(AiSlaEngineService.name)
  private readonly actionConfigs = new Map<string, SlaConfig>()
  private readonly snapshots = new Map<string, SlaSnapshot>()
  private readonly windowMs = 3600000
  private readonly maxLatencies = 10000

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getConfig(actionId: string): SlaConfig {
    return this.actionConfigs.get(actionId) || { ...DEFAULT_SLA }
  }

  setConfig(actionId: string, config: Partial<SlaConfig>): void {
    const existing = this.actionConfigs.get(actionId) || { ...DEFAULT_SLA }
    this.actionConfigs.set(actionId, { ...existing, ...config })
    this.logger.log(`SLA config updated for '${actionId}': ${JSON.stringify(config)}`)
  }

  recordLatency(actionId: string, latencyMs: number, companyId: string, userId?: string): void {
    const slaConfig = this.getConfig(actionId)

    if (latencyMs > slaConfig.alertThresholdMs) {
      this.recordBreach(actionId, latencyMs, slaConfig, companyId, userId)
    }

    let snapshot = this.snapshots.get(actionId)
    if (!snapshot || this.isExpired(snapshot)) {
      snapshot = { totalRequests: 0, latencies: [], sortedLatencies: null, breaches: 0, lastAlertAt: null }
    }
    snapshot.totalRequests++
    snapshot.latencies.push(latencyMs)
    snapshot.sortedLatencies = null
    if (snapshot.latencies.length > this.maxLatencies) {
      snapshot.latencies = snapshot.latencies.slice(-this.maxLatencies)
    }
    this.snapshots.set(actionId, snapshot)
  }

  private isExpired(snapshot: SlaSnapshot): boolean {
    return snapshot.latencies.length > 0
      && snapshot.totalRequests >= this.maxLatencies
      && snapshot.latencies.length === 0
  }

  private async recordBreach(actionId: string, latencyMs: number, config: SlaConfig, companyId: string, userId?: string): Promise<void> {
    const snapshot = this.snapshots.get(actionId) || { totalRequests: 0, latencies: [], sortedLatencies: null, breaches: 0, lastAlertAt: null }
    snapshot.breaches++
    this.snapshots.set(actionId, snapshot)

    this.eventEmitter.emit('ai-runtime.event', {
      type: 'sla_breach',
      data: { actionId, latencyMs, threshold: config.alertThresholdMs, companyId },
      timestamp: new Date().toISOString(),
    } as StreamingEvent)

    if (!snapshot.lastAlertAt || Date.now() - snapshot.lastAlertAt > 300000) {
      snapshot.lastAlertAt = Date.now()
      try {
        await this.notificationService.createWithTemplate(
          companyId,
          userId,
          NotificationType.GENERIC,
          {
            title: 'AI Service SLA Breach',
            message: `Action '${actionId}' exceeded SLA threshold: ${latencyMs}ms > ${config.alertThresholdMs}ms`,
            actionId,
            latencyMs,
            threshold: config.alertThresholdMs,
          },
          {
            priority: NotificationPriority.HIGH,
            sourceModule: 'ai-runtime',
            sourceId: actionId,
          },
        )
        this.logger.warn(`SLA breach alert sent: ${actionId} — ${latencyMs}ms > ${config.alertThresholdMs}ms`)
      } catch (err) {
        this.logger.error(`Failed to send SLA breach alert: ${(err as Error).message}`)
      }
    }
  }

  getStatus(actionId: string): SlaStatus {
    const config = this.getConfig(actionId)
    const snapshot = this.snapshots.get(actionId)
    if (!snapshot || snapshot.latencies.length === 0) {
      return {
        actionId,
        period: new Date().toISOString(),
        totalRequests: 0,
        avgLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        breaches: 0,
        breachRate: 0,
        slaTargetMs: config.alertThresholdMs,
        slaMet: true,
        maxLatencyMs: 0,
        minLatencyMs: 0,
      }
    }

    if (!snapshot.sortedLatencies) {
      snapshot.sortedLatencies = [...snapshot.latencies].sort((a, b) => a - b)
    }
    const sorted = snapshot.sortedLatencies
    const len = sorted.length
    const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / len)
    const p50 = sorted[Math.floor(len * 0.5)]
    const p95 = sorted[Math.floor(len * 0.95)]
    const p99 = sorted[Math.floor(len * 0.99)]

    return {
      actionId,
      period: new Date().toISOString(),
      totalRequests: snapshot.totalRequests,
      avgLatencyMs: avg,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      breaches: snapshot.breaches,
      breachRate: snapshot.totalRequests > 0 ? Math.round((snapshot.breaches / snapshot.totalRequests) * 10000) / 100 : 0,
      slaTargetMs: config.alertThresholdMs,
      slaMet: p95 <= config.p95TargetMs,
      maxLatencyMs: sorted[len - 1],
      minLatencyMs: sorted[0],
    }
  }

  getAllStatuses(): SlaStatus[] {
    const statuses: SlaStatus[] = []
    for (const actionId of this.snapshots.keys()) {
      statuses.push(this.getStatus(actionId))
    }
    return statuses
  }

  getSummary(): { totalActions: number; totalRequests: number; totalBreaches: number; averageP95: number } {
    let totalRequests = 0; let totalBreaches = 0; let p95Sum = 0; let count = 0
    for (const actionId of this.snapshots.keys()) {
      const status = this.getStatus(actionId)
      totalRequests += status.totalRequests
      totalBreaches += status.breaches
      if (status.p95LatencyMs > 0) { p95Sum += status.p95LatencyMs; count++ }
    }
    return {
      totalActions: this.snapshots.size,
      totalRequests,
      totalBreaches,
      averageP95: count > 0 ? Math.round(p95Sum / count) : 0,
    }
  }

  clearHistory(): void {
    this.snapshots.clear()
    this.logger.log('SLA history cleared')
  }
}
