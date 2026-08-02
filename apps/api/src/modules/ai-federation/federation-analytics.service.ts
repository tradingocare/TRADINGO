import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FederationAnalytics, FederationExecutionResult, FederationNodeResult } from './interfaces/federation.interfaces';

export interface StoredCollaboration {
  collaborationId: string;
  workflowId?: string;
  pattern: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  success: boolean;
  nodeCount: number;
  agentIds: string[];
  error?: string;
}

@Injectable()
export class FederationAnalyticsService {
  private readonly logger = new Logger(FederationAnalyticsService.name);
  private readonly maxHistory = 5000;
  private history: StoredCollaboration[] = [];

  constructor(private readonly eventBus: EventEmitter2) {
    this.eventBus.on('federation.collaboration.completed', (data: FederationExecutionResult) => {
      this.record(data);
    });
  }

  record(result: FederationExecutionResult): void {
    const agentIds = [...new Set(result.nodes.map((n) => n.agentId))];
    const entry: StoredCollaboration = {
      collaborationId: result.collaborationId,
      workflowId: result.workflowId,
      pattern: result.pattern,
      startedAt: new Date(Date.now() - result.totalLatencyMs),
      completedAt: new Date(),
      durationMs: result.totalLatencyMs,
      success: result.success,
      nodeCount: result.nodes.length,
      agentIds,
      error: result.error,
    };
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getSummary(): FederationAnalytics {
    const total = this.history.length;
    if (total === 0) {
      return {
        totalCollaborations: 0, activeCollaborations: 0, completedCollaborations: 0,
        failedCollaborations: 0, agentUtilization: [], collaborationTypeBreakdown: {},
        avgDurationMs: 0, p95DurationMs: 0,
      };
    }

    const completed = this.history.filter((h) => h.success).length;
    const failed = total - completed;
    const durations = this.history.map((h) => h.durationMs).sort((a, b) => a - b);
    const avgDurationMs = Math.round(durations.reduce((a, b) => a + b, 0) / total);
    const p95Index = Math.ceil(total * 0.95) - 1;
    const p95DurationMs = durations[p95Index] || 0;

    const typeBreakdown: Record<string, number> = {};
    this.history.forEach((h) => {
      typeBreakdown[h.pattern] = (typeBreakdown[h.pattern] || 0) + 1;
    });

    const agentCallCount = new Map<string, { total: number; success: number; totalLatency: number; name: string }>();
    for (const h of this.history) {
      for (const agentId of h.agentIds) {
        const current = agentCallCount.get(agentId) || { total: 0, success: 0, totalLatency: 0, name: agentId };
        current.total++;
        if (h.success) current.success++;
        current.totalLatency += h.durationMs;
        agentCallCount.set(agentId, current);
      }
    }

    const agentUtilization = Array.from(agentCallCount.entries()).map(([agentId, data]) => ({
      agentId,
      name: data.name,
      totalCalls: data.total,
      successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) / 100 : 0,
      avgLatencyMs: data.total > 0 ? Math.round(data.totalLatency / data.total) : 0,
    }));

    return {
      totalCollaborations: total,
      activeCollaborations: 0,
      completedCollaborations: completed,
      failedCollaborations: failed,
      agentUtilization,
      collaborationTypeBreakdown: typeBreakdown,
      avgDurationMs,
      p95DurationMs,
    };
  }

  getHistory(limit = 50, offset = 0): { data: StoredCollaboration[]; total: number } {
    const start = Math.min(offset, this.history.length);
    const end = Math.min(start + limit, this.history.length);
    return {
      data: this.history.slice(start, end).reverse(),
      total: this.history.length,
    };
  }

  getAgentUtilizationData(): { agentId: string; name: string; totalCalls: number; successRate: number; avgLatencyMs: number }[] {
    return this.getSummary().agentUtilization;
  }

  getCollaborationGraph(): { nodes: { id: string; name: string; group: string }[]; links: { source: string; target: string }[] } {
    const agentSet = new Set<string>();
    const links: { source: string; target: string }[] = [];

    for (const c of this.history) {
      for (let i = 0; i < c.agentIds.length - 1; i++) {
        c.agentIds.forEach((a) => agentSet.add(a));
        links.push({ source: c.agentIds[i], target: c.agentIds[i + 1] });
      }
    }

    const nodes = Array.from(agentSet).map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      group: id === 'founder' ? 'executive' : id === 'admin' ? 'platform' : 'agent',
    }));

    return { nodes, links };
  }
}
