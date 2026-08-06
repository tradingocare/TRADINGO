import { useQuery } from '@tanstack/react-query';
import { professionalAgentApi } from '@/lib/api/professional-agent';

export function useDashboardCopilot() {
  return useQuery({
    queryKey: ['professional-agent', 'dashboard-copilot'],
    queryFn: () => professionalAgentApi.getDashboardCopilot(),
  });
}

export function useClientAcquisition() {
  return useQuery({
    queryKey: ['professional-agent', 'client-acquisition'],
    queryFn: () => professionalAgentApi.getClientAcquisition(),
  });
}

export function useProposalIntelligence() {
  return useQuery({
    queryKey: ['professional-agent', 'proposal-intelligence'],
    queryFn: () => professionalAgentApi.getProposalIntelligence(),
  });
}

export function usePortfolioIntelligence() {
  return useQuery({
    queryKey: ['professional-agent', 'portfolio-intelligence'],
    queryFn: () => professionalAgentApi.getPortfolioIntelligence(),
  });
}

export function useReputationAdvisor() {
  return useQuery({
    queryKey: ['professional-agent', 'reputation-advisor'],
    queryFn: () => professionalAgentApi.getReputationAdvisor(),
  });
}

export function useRevenuePlanner() {
  return useQuery({
    queryKey: ['professional-agent', 'revenue-planner'],
    queryFn: () => professionalAgentApi.getRevenuePlanner(),
  });
}

export function useProfessionalNotifications() {
  return useQuery({
    queryKey: ['professional-agent', 'notifications'],
    queryFn: () => professionalAgentApi.getNotifications(),
  });
}

export function useTradeTalkIntegration() {
  return useQuery({
    queryKey: ['professional-agent', 'tradetalk-integration'],
    queryFn: () => professionalAgentApi.getTradeTalkIntegration(),
  });
}

export function useProfessionalAllInsights() {
  return useQuery({
    queryKey: ['professional-agent', 'insights'],
    queryFn: () => professionalAgentApi.getAllInsights(),
  });
}
