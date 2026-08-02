import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiRuntimeApi } from '@/lib/api/ai-runtime'

const QUERY_KEY = 'ai-runtime'
const TASKS_KEY = 'ai-runtime-tasks'
const CIRCUIT_KEY = 'ai-runtime-circuit-breakers'
const SLA_KEY = 'ai-runtime-sla'
const TELEMETRY_KEY = 'ai-runtime-telemetry'
const PROVIDERS_KEY = 'ai-runtime-providers'
const QUEUE_KEY = 'ai-runtime-queue'
const HEALTH_KEY = 'ai-runtime-health'
const TASK_KEY = 'ai-runtime-task'

export function useEnqueueTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: any) => aiRuntimeApi.enqueueTask(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  })
}

export function useDispatchAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: any) => aiRuntimeApi.dispatchAction(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  })
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { workflowId: string; companyId: string; userId?: string; context: Record<string, any>; priority?: number }) =>
      aiRuntimeApi.executeWorkflow(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  })
}

export function useExecuteParallel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { companyId: string; userId?: string; actions: { actionId: string; payload: Record<string, any>; priority?: number; timeoutMs?: number }[]; priority?: number }) =>
      aiRuntimeApi.executeParallel(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  })
}

export function useAiTasks(status?: string, limit?: number) {
  return useQuery({
    queryKey: [TASKS_KEY, status, limit],
    queryFn: () => aiRuntimeApi.listTasks(status, limit),
    refetchInterval: 10000,
  })
}

export function useAiTask(taskId: string | undefined) {
  return useQuery({
    queryKey: [TASK_KEY, taskId],
    queryFn: () => aiRuntimeApi.getTask(taskId!),
    enabled: !!taskId,
    refetchInterval: 5000,
  })
}

export function useCancelTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => aiRuntimeApi.cancelTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TASKS_KEY] }),
  })
}

export function useQueueCounts() {
  return useQuery({
    queryKey: [QUEUE_KEY],
    queryFn: () => aiRuntimeApi.getQueueCounts(),
    refetchInterval: 15000,
  })
}

export function useCircuitBreakers() {
  return useQuery({
    queryKey: [CIRCUIT_KEY],
    queryFn: () => aiRuntimeApi.getCircuitBreakers(),
    refetchInterval: 30000,
  })
}

export function useSetCircuitBreakerConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { actionId?: string; providerName?: string; failureRateThreshold?: number; minimumFailures?: number; recoveryTimeoutMs?: number; halfOpenMaxRequests?: number }) =>
      aiRuntimeApi.setCircuitBreakerConfig(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CIRCUIT_KEY] }),
  })
}

export function useResetCircuitBreaker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => aiRuntimeApi.resetCircuitBreaker(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CIRCUIT_KEY] }),
  })
}

export function useResetAllCircuitBreakers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => aiRuntimeApi.resetAllCircuitBreakers(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CIRCUIT_KEY] }),
  })
}

export function useSlaStatuses() {
  return useQuery({
    queryKey: [SLA_KEY],
    queryFn: () => aiRuntimeApi.getSlaStatuses(),
    refetchInterval: 30000,
  })
}

export function useSlaStatus(actionId: string | undefined) {
  return useQuery({
    queryKey: [SLA_KEY, actionId],
    queryFn: () => aiRuntimeApi.getSlaStatus(actionId!),
    enabled: !!actionId,
    refetchInterval: 30000,
  })
}

export function useSetSlaConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { actionId?: string; p50TargetMs?: number; p95TargetMs?: number; p99TargetMs?: number; alertThresholdMs?: number }) =>
      aiRuntimeApi.setSlaConfig(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SLA_KEY] }),
  })
}

export function useTelemetry() {
  return useQuery({
    queryKey: [TELEMETRY_KEY],
    queryFn: () => aiRuntimeApi.getTelemetry(),
    refetchInterval: 15000,
  })
}

export function useProviderStats() {
  return useQuery({
    queryKey: [PROVIDERS_KEY],
    queryFn: () => aiRuntimeApi.getProviderStats(),
    refetchInterval: 30000,
  })
}

export function useAiRuntimeHealth() {
  return useQuery({
    queryKey: [HEALTH_KEY],
    queryFn: () => aiRuntimeApi.getHealth(),
    refetchInterval: 30000,
  })
}
