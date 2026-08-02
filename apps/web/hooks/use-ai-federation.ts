'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as fed from '@/lib/api/ai-federation';

export function useFederationAgents() {
  return useQuery({ queryKey: ['federation', 'agents'], queryFn: fed.getRegisteredAgents, staleTime: 30000 });
}

export function useFederationCapabilities() {
  return useQuery({ queryKey: ['federation', 'capabilities'], queryFn: fed.getCapabilities, staleTime: 30000 });
}

export function useFederationWorkflows() {
  return useQuery({ queryKey: ['federation', 'workflows'], queryFn: fed.getWorkflows, staleTime: 60000 });
}

export function useFederationAnalytics() {
  return useQuery({ queryKey: ['federation', 'analytics'], queryFn: fed.getFederationAnalytics, staleTime: 10000 });
}

export function useFederationDashboard() {
  return useQuery({ queryKey: ['federation', 'dashboard'], queryFn: fed.getFederationDashboard, staleTime: 15000 });
}

export function useCollaborationHistory(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['federation', 'history', limit, offset],
    queryFn: () => fed.getCollaborationHistory(limit, offset),
    staleTime: 10000,
  });
}

export function useCollaborationGraph() {
  return useQuery({ queryKey: ['federation', 'graph'], queryFn: fed.getCollaborationGraph, staleTime: 30000 });
}

export function useAgentUtilization() {
  return useQuery({ queryKey: ['federation', 'utilization'], queryFn: fed.getAgentUtilization, staleTime: 15000 });
}

export function useActiveCollaborations() {
  return useQuery({ queryKey: ['federation', 'active'], queryFn: fed.getActiveCollaborations, staleTime: 5000 });
}

export function useExecuteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, context }: { workflowId: string; context: { companyId: string; role: string; payload: Record<string, unknown> } }) =>
      fed.executeWorkflow(workflowId, context),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['federation'] });
    },
  });
}

export function useSmartExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goal, context }: { goal: string; context: { companyId: string; role: string; payload: Record<string, unknown> } }) =>
      fed.smartExecute(goal, context),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['federation'] });
    },
  });
}

export function useCancelCollaboration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collaborationId: string) => fed.cancelCollaboration(collaborationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['federation', 'active'] });
    },
  });
}
