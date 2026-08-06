import { Injectable } from '@nestjs/common'
import { AiDispatchEvent } from './dto/ai-orchestrator.dto'

@Injectable()
export class AiObservabilityService {
  private events: AiDispatchEvent[] = []
  private readonly MAX_EVENTS = 1000

  record(event: Omit<AiDispatchEvent, 'timestamp'>): void {
    this.events.push({ ...event, timestamp: new Date() })
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }
  }

  getRecent(limit = 50): AiDispatchEvent[] {
    return this.events.slice(-limit).reverse()
  }

  getStats() {
    const total = this.events.length
    const successCount = this.events.filter(e => e.success).length
    const failedCount = this.events.filter(e => !e.success).length
    const avgLatency = total > 0
      ? Math.round(this.events.reduce((s, e) => s + e.latencyMs, 0) / total)
      : 0
    const actionBreakdown: Record<string, { total: number; success: number; failed: number; avgLatency: number }> = {}
    for (const e of this.events) {
      if (!actionBreakdown[e.actionId]) {
        actionBreakdown[e.actionId] = { total: 0, success: 0, failed: 0, avgLatency: 0 }
      }
      actionBreakdown[e.actionId].total++
      if (e.success) actionBreakdown[e.actionId].success++
      else actionBreakdown[e.actionId].failed++
    }
    for (const key of Object.keys(actionBreakdown)) {
      const b = actionBreakdown[key]
      b.avgLatency = Math.round(
        this.events
          .filter(e => e.actionId === key)
          .reduce((s, e) => s + e.latencyMs, 0) / b.total
      )
    }
    return { total, successCount, failedCount, avgLatency, actionBreakdown }
  }

  getEventsByAction(actionId: string): AiDispatchEvent[] {
    return this.events.filter(e => e.actionId === actionId).slice(-20).reverse()
  }

  clear(): void {
    this.events = []
  }
}
