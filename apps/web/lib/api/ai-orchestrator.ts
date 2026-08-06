import api from './client'

export interface AiActionInfo {
  id: string
  name: string
  description: string
  service: string
  method: string
  taskType: string
  credits: number
  requiredRole: string[]
  module: string
  tags: string[]
  available?: boolean
}

export interface OrchestrateRequest {
  actionId: string
  companyId: string
  userId?: string
  payload: Record<string, any>
  useCache?: boolean
}

export interface OrchestrateResponse {
  success: boolean
  actionId: string
  actionName: string
  actionDescription: string
  result: any
  latencyMs: number
  credits: { required: number; remaining: number } | null
  cached: boolean
  fromMemory: boolean
  fromCache: boolean
  error?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  tags: string[]
  steps: Array<{ actionId: string; inputMapping?: Record<string, string>; outputMapping?: Record<string, string> }>
}

export interface WorkflowStepResult {
  step: number
  actionId: string
  success: boolean
  result: any
  latencyMs: number
  error?: string
}

export interface WorkflowExecuteResponse {
  success: boolean
  workflowId: string
  workflowName: string
  stepsCompleted: number
  totalSteps: number
  results: WorkflowStepResult[]
  totalLatencyMs: number
  finalContext: Record<string, any>
  error?: string
}

export interface MemoryStats {
  size: number
  maxSize: number
  hitRate: number
  missRate: number
  hits: number
  misses: number
}

export interface ObservabilityEvent {
  actionId: string
  actionName: string
  companyId: string
  userId?: string
  success: boolean
  latencyMs: number
  credits: { required: number; remaining: number } | null
  cached: boolean
  fromMemory: boolean
  error?: string
  timestamp: string
}

export interface ObservabilityStats {
  total: number
  successCount: number
  failedCount: number
  avgLatency: number
  actionBreakdown: Record<string, { total: number; success: number; failed: number; avgLatency: number }>
}

export function aiOrchestrate(data: OrchestrateRequest) {
  return api.post<OrchestrateResponse>('/ai/orchestrate', data)
}

export function aiWorkflowExecute(workflowId: string, data: { companyId: string; userId?: string; context: Record<string, any> }) {
  return api.post<WorkflowExecuteResponse>(`/ai/workflow/${workflowId}/execute`, data)
}

export function aiListActions() {
  return api.get<{ total: number; actions: AiActionInfo[] }>('/ai/actions')
}

export function aiGetAction(id: string) {
  return api.get<AiActionInfo & { available: boolean }>(`/ai/actions/${id}`)
}

export function aiGetContext(data: { companyId: string; productId?: string; userId?: string; include: string[] }) {
  return api.post<Record<string, any>>('/ai/context', data)
}

export function aiMemoryStats() {
  return api.get<MemoryStats>('/ai/orchestrator/memory')
}

export function aiObservabilityStats() {
  return api.get<{ stats: ObservabilityStats; recent: ObservabilityEvent[] }>('/ai/orchestrator/observability')
}

export function aiClearCache() {
  return api.post<{ cleared: boolean }>('/ai/orchestrator/cache/clear')
}
