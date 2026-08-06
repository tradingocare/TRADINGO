import { apiClient } from './client'

export interface AiTaskInfo {
  id: string
  jobId?: string
  type: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED'
  companyId: string
  userId?: string
  actionId?: string
  priority: number
  progress: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  result?: any
  error?: string
  timeoutMs?: number
  workflowId?: string
}

export interface CircuitBreakerStatus {
  actionId?: string
  providerName?: string
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  failureThreshold: number
  recoveryTimeoutMs: number
  halfOpenMaxRequests: number
  halfOpenRequests: number
  openedAt?: string
  lastFailureAt?: string
  lastSuccessAt?: string
  cooldownRemainingMs?: number
}

export interface SlaStatus {
  actionId: string
  period: string
  totalRequests: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  breaches: number
  breachRate: number
  slaTargetMs: number
  slaMet: boolean
  maxLatencyMs: number
  minLatencyMs: number
}

export interface TelemetrySnapshot {
  queueDepth: number
  activeWorkers: number
  waitingJobs: number
  completedJobs24h: number
  failedJobs24h: number
  avgLatencyMs24h: number
  p95LatencyMs24h: number
  p99LatencyMs24h: number
  circuitBreakers: { closed: number; open: number; halfOpen: number }
  slaBreaches24h: number
  topErrors: { error: string; count: number }[]
  workerUtilizationPct: number
  timestamp: string
}

export interface QueueCounts {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

export interface AiRuntimeHealth {
  status: string
  queue: { active: number; waiting: number }
  circuitBreakers: { closed: number; open: number; halfOpen: number }
  timestamp: string
}

export const aiRuntimeApi = {
  enqueueTask: (dto: any) =>
    apiClient.post('/ai-runtime/enqueue', dto).then(r => r.data),

  dispatchAction: (dto: any) =>
    apiClient.post('/ai-runtime/dispatch', dto).then(r => r.data),

  executeWorkflow: (dto: any) =>
    apiClient.post('/ai-runtime/workflow', dto).then(r => r.data),

  executeParallel: (dto: any) =>
    apiClient.post('/ai-runtime/parallel', dto).then(r => r.data),

  listTasks: (status?: string, limit?: number) =>
    apiClient.get('/ai-runtime/tasks', { params: { status, limit } }).then(r => r.data),

  getTask: (taskId: string) =>
    apiClient.get(`/ai-runtime/tasks/${taskId}`).then(r => r.data),

  cancelTask: (taskId: string) =>
    apiClient.delete(`/ai-runtime/tasks/${taskId}`).then(r => r.data),

  getQueueCounts: () =>
    apiClient.get<QueueCounts>('/ai-runtime/queue/counts').then(r => r.data),

  getCircuitBreakers: () =>
    apiClient.get<CircuitBreakerStatus[]>('/ai-runtime/circuit-breakers').then(r => r.data),

  setCircuitBreakerConfig: (dto: any) =>
    apiClient.post('/ai-runtime/circuit-breakers/config', dto).then(r => r.data),

  resetCircuitBreaker: (key: string) =>
    apiClient.post(`/ai-runtime/circuit-breakers/${key}/reset`).then(r => r.data),

  resetAllCircuitBreakers: () =>
    apiClient.post('/ai-runtime/circuit-breakers/reset-all').then(r => r.data),

  getSlaStatuses: () =>
    apiClient.get<SlaStatus[]>('/ai-runtime/sla').then(r => r.data),

  getSlaStatus: (actionId: string) =>
    apiClient.get<SlaStatus>(`/ai-runtime/sla/${actionId}`).then(r => r.data),

  setSlaConfig: (dto: any) =>
    apiClient.post('/ai-runtime/sla/config', dto).then(r => r.data),

  getTelemetry: () =>
    apiClient.get<TelemetrySnapshot>('/ai-runtime/telemetry').then(r => r.data),

  getProviderStats: () =>
    apiClient.get<any[]>('/ai-runtime/telemetry/providers').then(r => r.data),

  getHealth: () =>
    apiClient.get<AiRuntimeHealth>('/ai-runtime/health').then(r => r.data),
}
