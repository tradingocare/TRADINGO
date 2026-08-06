import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUnifiedDashboard, getHealth,
  getKpis, getKpiDefinitions, getKpiDetail,
  getAlertDefinitions, getAlertDefinition, createAlertDefinition,
  updateAlertDefinition, deleteAlertDefinition, evaluateAlerts,
  acknowledgeAlert, resolveAlert, getAlertHistory, getAlertStats,
  getCorrelations, getCorrelationsForKpi,
  getConsolidatedHealth, AlertDefinition,
} from '@/lib/api/executive-intelligence'

const EI_KEY = 'executive-intelligence'

export function useUnifiedDashboard() {
  return useQuery({ queryKey: [EI_KEY, 'unified'], queryFn: getUnifiedDashboard, refetchInterval: 120000, staleTime: 60000 })
}

export function useHealth(params?: { revenueWeight?: number; growthWeight?: number; retentionWeight?: number; trustWeight?: number; marketplaceWeight?: number }) {
  return useQuery({ queryKey: [EI_KEY, 'health', params], queryFn: () => getHealth(params), refetchInterval: 120000, staleTime: 60000 })
}

export function useKpis(params?: { domain?: string; search?: string; status?: string }) {
  return useQuery({ queryKey: [EI_KEY, 'kpis', params], queryFn: () => getKpis(params), staleTime: 30000 })
}

export function useKpiDefinitions() {
  return useQuery({ queryKey: [EI_KEY, 'kpis', 'definitions'], queryFn: getKpiDefinitions, staleTime: 300000 })
}

export function useKpiDetail(id: string | null) {
  return useQuery({ queryKey: [EI_KEY, 'kpis', id], queryFn: () => getKpiDetail(id!), enabled: !!id, staleTime: 30000 })
}

export function useAlertDefinitions() {
  return useQuery({ queryKey: [EI_KEY, 'alerts', 'definitions'], queryFn: getAlertDefinitions, refetchInterval: 120000, staleTime: 60000 })
}

export function useAlertDefinition(id: string | null) {
  return useQuery({ queryKey: [EI_KEY, 'alerts', 'definitions', id], queryFn: () => getAlertDefinition(id!), enabled: !!id })
}

export function useCreateAlertDefinition() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createAlertDefinition, onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useUpdateAlertDefinition() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<AlertDefinition> }) => updateAlertDefinition(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useDeleteAlertDefinition() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => deleteAlertDefinition(id), onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useEvaluateAlerts() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: evaluateAlerts, onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (eventId: string) => acknowledgeAlert(eventId), onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (eventId: string) => resolveAlert(eventId), onSuccess: () => qc.invalidateQueries({ queryKey: [EI_KEY, 'alerts'] }) })
}

export function useAlertHistory(params?: { severity?: string; status?: string; alertId?: string; limit?: number }) {
  return useQuery({ queryKey: [EI_KEY, 'alerts', 'history', params], queryFn: () => getAlertHistory(params), refetchInterval: 120000, staleTime: 60000 })
}

export function useAlertStats() {
  return useQuery({ queryKey: [EI_KEY, 'alerts', 'stats'], queryFn: getAlertStats, refetchInterval: 120000, staleTime: 60000 })
}

export function useCorrelations(params?: { kpiId?: string; minStrength?: string; limit?: number }) {
  return useQuery({ queryKey: [EI_KEY, 'correlations', params], queryFn: () => getCorrelations(params), staleTime: 300000 })
}

export function useCorrelationsForKpi(kpiId: string | null) {
  return useQuery({ queryKey: [EI_KEY, 'correlations', kpiId], queryFn: () => getCorrelationsForKpi(kpiId!), enabled: !!kpiId, staleTime: 300000 })
}

export function useConsolidatedHealth(params?: { founderAiWeight?: number; enterpriseWeight?: number; marketplaceWeight?: number }) {
  return useQuery({ queryKey: [EI_KEY, 'health', 'consolidated', params], queryFn: () => getConsolidatedHealth(params), refetchInterval: 120000, staleTime: 60000 })
}
