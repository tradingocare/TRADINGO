import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../../../common/services/redis.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { KpiCatalogService } from './kpi-catalog.service';
import {
  AlertDefinitionDto, CreateAlertDefinitionDto, UpdateAlertDefinitionDto,
  AlertEventDto, AlertStatsDto, EvaluateAlertsResponseDto, AlertHistoryQueryDto,
} from '../dto/alert-engine.dto';

interface AlertDefinitionInternal {
  id: string;
  name: string;
  description: string;
  kpiId: string;
  condition: { operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'; value: number };
  severity: 'info' | 'warning' | 'critical';
  cooldownSeconds: number;
  enabled: boolean;
  createdAt: string;
}

interface AlertEventInternal {
  id: string;
  alertId: string;
  alertName: string;
  severity: string;
  kpiId: string;
  actualValue: number | null;
  threshold: number;
  operator: string;
  message: string;
  status: 'fired' | 'acknowledged' | 'resolved';
  firedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

@Injectable()
export class AlertEngineService {
  private readonly logger = new Logger(AlertEngineService.name);
  private definitions: AlertDefinitionInternal[] = [];
  private events: AlertEventInternal[] = [];
  private readonly maxEvents = 5000;

  constructor(
    private readonly kpiCatalog: KpiCatalogService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.seedDefaultDefinitions();
  }

  private seedDefaultDefinitions(): void {
    const now = new Date().toISOString();
    this.definitions = [
      {
        id: 'alert-revenue-drop', name: 'Revenue Drop Alert', description: 'Fires when today revenue drops below yesterday',
        kpiId: 'revenue.today', condition: { operator: 'lt', value: 0 }, severity: 'warning', cooldownSeconds: 600, enabled: true, createdAt: now,
      },
      {
        id: 'alert-growth-negative', name: 'Negative Growth Alert', description: 'Fires when 30d revenue growth is negative',
        kpiId: 'revenue.growth30d', condition: { operator: 'lt', value: 0 }, severity: 'critical', cooldownSeconds: 1800, enabled: true, createdAt: now,
      },
      {
        id: 'alert-health-critical', name: 'Health Score Critical', description: 'Fires when platform health drops below critical threshold',
        kpiId: 'health.founderAi', condition: { operator: 'lt', value: 30 }, severity: 'critical', cooldownSeconds: 900, enabled: true, createdAt: now,
      },
      {
        id: 'alert-health-warning', name: 'Health Score Warning', description: 'Fires when platform health drops below warning threshold',
        kpiId: 'health.founderAi', condition: { operator: 'lt', value: 50 }, severity: 'warning', cooldownSeconds: 600, enabled: true, createdAt: now,
      },
      {
        id: 'alert-trust-drop', name: 'Trust Score Decline', description: 'Fires when average trust score drops below 50',
        kpiId: 'trust.averageScore', condition: { operator: 'lt', value: 50 }, severity: 'warning', cooldownSeconds: 1800, enabled: true, createdAt: now,
      },
      {
        id: 'alert-gmv-decline', name: 'GMV Decline', description: 'Fires when GMV drops below threshold',
        kpiId: 'marketplace.gmv', condition: { operator: 'lt', value: 10000 }, severity: 'info', cooldownSeconds: 3600, enabled: false, createdAt: now,
      },
    ];
  }

  getDefinitions(): AlertDefinitionDto[] {
    return this.definitions.map(d => ({ ...d }));
  }

  getDefinition(id: string): AlertDefinitionDto | undefined {
    const d = this.definitions.find(x => x.id === id);
    return d ? { ...d } : undefined;
  }

  createDefinition(dto: CreateAlertDefinitionDto): AlertDefinitionDto {
    const def: AlertDefinitionInternal = {
      id: `alert-${uuid().slice(0, 8)}`,
      name: dto.name,
      description: dto.description,
      kpiId: dto.kpiId,
      condition: dto.condition,
      severity: dto.severity,
      cooldownSeconds: dto.cooldownSeconds ?? 300,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    this.definitions.push(def);
    return { ...def };
  }

  updateDefinition(id: string, dto: UpdateAlertDefinitionDto): AlertDefinitionDto | null {
    const def = this.definitions.find(x => x.id === id);
    if (!def) return null;
    if (dto.name !== undefined) def.name = dto.name;
    if (dto.description !== undefined) def.description = dto.description;
    if (dto.condition !== undefined) def.condition = dto.condition;
    if (dto.severity !== undefined) def.severity = dto.severity;
    if (dto.cooldownSeconds !== undefined) def.cooldownSeconds = dto.cooldownSeconds;
    if (dto.enabled !== undefined) def.enabled = dto.enabled;
    return { ...def };
  }

  deleteDefinition(id: string): boolean {
    const idx = this.definitions.findIndex(x => x.id === id);
    if (idx === -1) return false;
    this.definitions.splice(idx, 1);
    return true;
  }

  async evaluateAllAlerts(): Promise<EvaluateAlertsResponseDto> {
    const fired: AlertEventInternal[] = [];
    const active: AlertEventInternal[] = [];
    const enabledDefs = this.definitions.filter(d => d.enabled);

    const kpiIds = [...new Set(enabledDefs.map(d => d.kpiId))];
    const kpiValues = await this.kpiCatalog.getMultipleKpiValues(kpiIds);

    for (const def of enabledDefs) {
      try {
        const value = kpiValues.get(def.kpiId);
        if (!value || value.currentValue === null) continue;

        const isBreached = this.evaluateCondition(value.currentValue, def.condition.operator, def.condition.value);
        if (!isBreached) continue;

        const withinCooldown = await this.checkCooldown(def.id);
        if (withinCooldown) continue;

        await this.setCooldown(def.id, def.cooldownSeconds);

        const event: AlertEventInternal = {
          id: uuid(),
          alertId: def.id,
          alertName: def.name,
          severity: def.severity,
          kpiId: def.kpiId,
          actualValue: value.currentValue,
          threshold: def.condition.value,
          operator: def.condition.operator,
          message: `${def.name}: ${value.currentValue} ${def.condition.operator} ${def.condition.value} (${value.name})`,
          status: 'fired',
          firedAt: new Date().toISOString(),
        };
        fired.push(event);
        this.addEvent(event);

        this.logger.warn(`Alert FIRED: ${event.message}`);
        this.persistToUsageEvent(event).catch((err) => this.logger.warn(`Alert usage event fire failed: ${err}`));
      } catch (err) {
        this.logger.error(`Error evaluating alert ${def.id}: ${err}`);
      }
    }

    active.push(...this.events.filter(e => e.status === 'fired' || e.status === 'acknowledged'));
    active.sort((a, b) => new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime());

    return {
      fired: fired.map(e => ({ ...e })),
      active: active.slice(0, 50).map(e => ({ ...e })),
      totalEvaluated: enabledDefs.length,
      evaluatedAt: new Date().toISOString(),
    };
  }

  acknowledgeAlert(eventId: string): AlertEventDto | null {
    const event = this.events.find(e => e.id === eventId);
    if (!event || event.status !== 'fired') return null;
    event.status = 'acknowledged';
    event.acknowledgedAt = new Date().toISOString();
    return { ...event };
  }

  resolveAlert(eventId: string): AlertEventDto | null {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return null;
    event.status = 'resolved';
    event.resolvedAt = new Date().toISOString();
    return { ...event };
  }

  getAlertHistory(query?: AlertHistoryQueryDto): AlertEventDto[] {
    let result = [...this.events];
    if (query?.severity) result = result.filter(e => e.severity === query.severity);
    if (query?.status) result = result.filter(e => e.status === query.status);
    if (query?.alertId) result = result.filter(e => e.alertId === query.alertId);
    result.sort((a, b) => new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime());
    const limit = query?.limit ?? 100;
    return result.slice(0, limit).map(e => ({ ...e }));
  }

  getStats(): AlertStatsDto {
    const all = this.events;
    return {
      totalAlerts: all.length,
      activeAlerts: all.filter(e => e.status === 'fired' || e.status === 'acknowledged').length,
      criticalCount: all.filter(e => e.severity === 'critical').length,
      warningCount: all.filter(e => e.severity === 'warning').length,
      infoCount: all.filter(e => e.severity === 'info').length,
      definitionsCount: this.definitions.length,
      mostFrequent: this.getMostFrequentAlerts(),
    };
  }

  private getMostFrequentAlerts(): { alertId: string; alertName: string; count: number }[] {
    const counts = new Map<string, { alertId: string; alertName: string; count: number }>();
    for (const e of this.events) {
      const existing = counts.get(e.alertId);
      if (existing) { existing.count++; } else { counts.set(e.alertId, { alertId: e.alertId, alertName: e.alertName, count: 1 }); }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      default: return false;
    }
  }

  private async checkCooldown(alertId: string): Promise<boolean> {
    try {
      const key = `alert:cooldown:${alertId}`;
      return await this.redis.exists(key);
    } catch { return false; }
  }

  private async setCooldown(alertId: string, seconds: number): Promise<void> {
    try {
      const key = `alert:cooldown:${alertId}`;
      await this.redis.set(key, '1', seconds);
    } catch {
      this.logger.warn(`Failed to set alert cooldown: ${alertId}`);
    }
  }

  private async persistToUsageEvent(event: AlertEventInternal): Promise<void> {
    try {
      await this.prisma.usageEvent.create({
        data: {
          companyId: 'system',
          eventName: 'alert.fired',
          category: 'alert',
          properties: {
            alertId: event.alertId,
            alertName: event.alertName,
            severity: event.severity,
            kpiId: event.kpiId,
            actualValue: event.actualValue,
            threshold: event.threshold,
            message: event.message,
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to persist alert to UsageEvent: ${err}`);
    }
  }

  private addEvent(event: AlertEventInternal): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }
}
