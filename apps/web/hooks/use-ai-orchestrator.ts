import { useMutation, useQuery } from '@tanstack/react-query'
import {
  aiOrchestrate, aiWorkflowExecute, aiListActions, aiGetAction,
  aiGetContext, aiMemoryStats, aiObservabilityStats, aiClearCache,
} from '@/lib/api/ai-orchestrator'

export function useAiOrchestrate() {
  return useMutation({ mutationFn: (data: Parameters<typeof aiOrchestrate>[0]) => aiOrchestrate(data) })
}

export function useAiWorkflowExecute() {
  return useMutation({ mutationFn: ({ workflowId, ...data }: { workflowId: string; companyId: string; userId?: string; context: Record<string, any> }) => aiWorkflowExecute(workflowId, data) })
}

export function useAiListActions() {
  return useQuery({ queryKey: ['ai-actions'], queryFn: () => aiListActions(), staleTime: 60000 })
}

export function useAiGetAction(id: string) {
  return useQuery({ queryKey: ['ai-action', id], queryFn: () => aiGetAction(id), enabled: !!id, staleTime: 30000 })
}

export function useAiGetContext() {
  return useMutation({ mutationFn: (data: Parameters<typeof aiGetContext>[0]) => aiGetContext(data) })
}

export function useAiMemoryStats() {
  return useQuery({ queryKey: ['ai-memory-stats'], queryFn: () => aiMemoryStats(), refetchInterval: 10000 })
}

export function useAiObservabilityStats() {
  return useQuery({ queryKey: ['ai-observability-stats'], queryFn: () => aiObservabilityStats(), refetchInterval: 10000 })
}

export function useAiClearCache() {
  return useMutation({ mutationFn: () => aiClearCache() })
}
