import api from './client'

export interface UnifiedDashboardOverview {
  totalRevenue: number; todayRevenue: number; revenueGrowth: number;
  totalOrders: number; ordersToday: number; orderGrowth30d: number;
  totalUsers: number; totalCompanies: number; activeRfqs: number;
  pendingVerifications: number; openDisputes: number;
}
export interface UnifiedDashboardHealth {
  overallScore: number; grade: string; source: string;
  dimensions: { name: string; score: number; weight: number; contribution: number; status: string; description?: string }[];
}
export interface UnifiedDashboardFinance {
  escrowBalance: number; pendingSettlements: number; commissionEarned: number;
  activeDisputes: number; failedSettlements: number;
}
export interface UnifiedDashboardResponse {
  overview: UnifiedDashboardOverview;
  health: UnifiedDashboardHealth;
  finance: UnifiedDashboardFinance;
  enterprise: Record<string, unknown>;
  generatedAt: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  overallScore: number; grade: string; period: string; source: string; generatedAt: string;
  dimensions: { name: string; score: number; weight: number; contribution: number; status: string }[];
}

export interface KpiValue {
  id: string; name: string; domain: string; source: string; unit: string;
  description: string; currentValue: number | null; previousValue: number | null;
  change: number | null; changePercent: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  trend: 'up' | 'down' | 'stable' | 'unknown'; updatedAt: string;
}
export interface KpiCatalogResponse { kpis: KpiValue[]; total: number; byDomain: Record<string, number>; generatedAt: string; }
export interface KpiDefinition { id: string; name: string; domain: string; source: string; unit: string; description: string; }

export interface AlertDefinition {
  id: string; name: string; description: string; kpiId: string;
  condition: { operator: string; value: number };
  severity: string; cooldownSeconds: number; enabled: boolean; createdAt: string;
}
export interface AlertEvent {
  id: string; alertId: string; alertName: string; severity: string; kpiId: string;
  actualValue: number | null; threshold: number; operator: string; message: string;
  status: 'fired' | 'acknowledged' | 'resolved';
  firedAt: string; acknowledgedAt?: string; resolvedAt?: string;
}
export interface AlertStats { totalAlerts: number; activeAlerts: number; criticalCount: number; warningCount: number; infoCount: number; definitionsCount: number; mostFrequent: { alertId: string; alertName: string; count: number }[]; }
export interface EvaluateAlertsResponse { fired: AlertEvent[]; active: AlertEvent[]; totalEvaluated: number; evaluatedAt: string; }

export interface KpiCorrelation {
  kpi1: string; kpi1Name: string; kpi2: string; kpi2Name: string;
  correlationCoefficient: number; strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none'; lag: number; sampleSize: number; description: string;
}
export interface AllCorrelationsResponse { correlations: KpiCorrelation[]; total: number; generatedAt: string; }
export interface KpiCorrelationsResponse { kpiId: string; kpiName: string; correlations: KpiCorrelation[]; total: number; generatedAt: string; }

export interface ConsolidatedHealthDimension {
  name: string; founderAiScore: number | null; enterpriseScore: number | null;
  consolidatedScore: number; weight: number; status: 'healthy' | 'monitor' | 'critical';
}
export interface HealthSourceBreakdown { source: string; overallScore: number | null; grade: string | null; dimensions: { name: string; score: number }[]; }
export interface ConsolidatedHealthResponse {
  status: 'healthy' | 'degraded' | 'critical'; overallScore: number; grade: string;
  dimensions: ConsolidatedHealthDimension[]; sources: HealthSourceBreakdown[];
  weights: { founderAi: number; enterprise: number; marketplace: number };
  period: string; recommendations: string[]; generatedAt: string;
}

export function getUnifiedDashboard() { return api.get<UnifiedDashboardResponse>('/founder/intelligence/unified').then(r => r.data); }
export function getHealth(params?: { revenueWeight?: number; growthWeight?: number; retentionWeight?: number; trustWeight?: number; marketplaceWeight?: number }) { return api.get<HealthResponse>('/founder/intelligence/health', { params }).then(r => r.data); }

export function getKpis(params?: { domain?: string; search?: string; status?: string }) { return api.get<KpiCatalogResponse>('/founder/intelligence/kpis', { params }).then(r => r.data); }
export function getKpiDefinitions() { return api.get<KpiDefinition[]>('/founder/intelligence/kpis/definitions').then(r => r.data); }
export function getKpiDetail(id: string) { return api.get(`/founder/intelligence/kpis/${id}`).then(r => r.data); }

export function getAlertDefinitions() { return api.get<AlertDefinition[]>('/founder/intelligence/alerts/definitions').then(r => r.data); }
export function getAlertDefinition(id: string) { return api.get<AlertDefinition>(`/founder/intelligence/alerts/definitions/${id}`).then(r => r.data); }
export function createAlertDefinition(data: { name: string; description: string; kpiId: string; condition: { operator: string; value: number }; severity: string; cooldownSeconds?: number }) { return api.post<AlertDefinition>('/founder/intelligence/alerts/definitions', data).then(r => r.data); }
export function updateAlertDefinition(id: string, data: Partial<AlertDefinition>) { return api.patch<AlertDefinition>(`/founder/intelligence/alerts/definitions/${id}`, data).then(r => r.data); }
export function deleteAlertDefinition(id: string) { return api.delete(`/founder/intelligence/alerts/definitions/${id}`).then(r => r.data); }
export function evaluateAlerts() { return api.post<EvaluateAlertsResponse>('/founder/intelligence/alerts/evaluate').then(r => r.data); }
export function acknowledgeAlert(eventId: string) { return api.post<AlertEvent>(`/founder/intelligence/alerts/${eventId}/acknowledge`).then(r => r.data); }
export function resolveAlert(eventId: string) { return api.post<AlertEvent>(`/founder/intelligence/alerts/${eventId}/resolve`).then(r => r.data); }
export function getAlertHistory(params?: { severity?: string; status?: string; alertId?: string; limit?: number }) { return api.get<AlertEvent[]>('/founder/intelligence/alerts/history', { params }).then(r => r.data); }
export function getAlertStats() { return api.get<AlertStats>('/founder/intelligence/alerts/stats').then(r => r.data); }

export function getCorrelations(params?: { kpiId?: string; minStrength?: string; limit?: number }) { return api.get<AllCorrelationsResponse>('/founder/intelligence/correlations', { params }).then(r => r.data); }
export function getCorrelationsForKpi(kpiId: string) { return api.get<KpiCorrelationsResponse>(`/founder/intelligence/correlations/${kpiId}`).then(r => r.data); }

export function getConsolidatedHealth(params?: { founderAiWeight?: number; enterpriseWeight?: number; marketplaceWeight?: number }) { return api.get<ConsolidatedHealthResponse>('/founder/intelligence/health/consolidated', { params }).then(r => r.data); }
