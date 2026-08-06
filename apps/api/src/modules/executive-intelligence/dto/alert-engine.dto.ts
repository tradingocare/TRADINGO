export class AlertDefinitionDto {
  id: string;
  name: string;
  description: string;
  kpiId: string;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    value: number;
  };
  severity: 'info' | 'warning' | 'critical';
  cooldownSeconds: number;
  enabled: boolean;
  createdAt: string;
}

export class CreateAlertDefinitionDto {
  name: string;
  description: string;
  kpiId: string;
  condition: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    value: number;
  };
  severity: 'info' | 'warning' | 'critical';
  cooldownSeconds?: number;
}

export class UpdateAlertDefinitionDto {
  name?: string;
  description?: string;
  condition?: {
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    value: number;
  };
  severity?: 'info' | 'warning' | 'critical';
  cooldownSeconds?: number;
  enabled?: boolean;
}

export class AlertEventDto {
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

export class AlertHistoryQueryDto {
  severity?: string;
  status?: string;
  alertId?: string;
  limit?: number;
}

export class AlertStatsDto {
  totalAlerts: number;
  activeAlerts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  definitionsCount: number;
  mostFrequent: { alertId: string; alertName: string; count: number }[];
}

export class EvaluateAlertsResponseDto {
  fired: AlertEventDto[];
  active: AlertEventDto[];
  totalEvaluated: number;
  evaluatedAt: string;
}
