'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as exec from '@/lib/api/executive-agent';

export function useExecutiveCopilot() {
  return useQuery({ queryKey: ['executive', 'copilot'], queryFn: exec.getExecutiveCopilot, staleTime: 30000 });
}

export function useExecutiveKpi() {
  return useQuery({ queryKey: ['executive', 'kpi'], queryFn: exec.getExecutiveKpi, staleTime: 60000 });
}

export function useExecutiveRisks(timeframe?: string) {
  return useQuery({ queryKey: ['executive', 'risks', timeframe], queryFn: () => exec.getExecutiveRisks(timeframe), staleTime: 30000 });
}

export function useExecutiveOpportunities() {
  return useQuery({ queryKey: ['executive', 'opportunities'], queryFn: exec.getExecutiveOpportunities, staleTime: 60000 });
}

export function useExecutiveAnalytics() {
  return useQuery({ queryKey: ['executive', 'analytics'], queryFn: exec.getExecutiveAnalytics, staleTime: 60000 });
}

export function useCoordinateWithAgent() {
  return useMutation({ mutationFn: ({ targetAgentId, action, payload }: { targetAgentId: string; action: string; payload: Record<string, unknown> }) => exec.coordinateWithAgent(targetAgentId, action, payload) });
}
