import { useQuery } from '@tanstack/react-query';
import { communityAgentApi } from '@/lib/api/community-agent';

export function useCommunityDashboardCopilot() {
  return useQuery({
    queryKey: ['community-agent', 'dashboard-copilot'],
    queryFn: () => communityAgentApi.getDashboardCopilot(),
  });
}

export function useNetworkingAdvisor() {
  return useQuery({
    queryKey: ['community-agent', 'networking-advisor'],
    queryFn: () => communityAgentApi.getNetworkingAdvisor(),
  });
}

export function useCommunityIntelligence() {
  return useQuery({
    queryKey: ['community-agent', 'community-intelligence'],
    queryFn: () => communityAgentApi.getCommunityIntelligence(),
  });
}

export function useKnowledgeDiscovery() {
  return useQuery({
    queryKey: ['community-agent', 'knowledge-discovery'],
    queryFn: () => communityAgentApi.getKnowledgeDiscovery(),
  });
}

export function useCollaborationAdvisor() {
  return useQuery({
    queryKey: ['community-agent', 'collaboration-advisor'],
    queryFn: () => communityAgentApi.getCollaborationAdvisor(),
  });
}

export function useCommunityReputation() {
  return useQuery({
    queryKey: ['community-agent', 'community-reputation'],
    queryFn: () => communityAgentApi.getCommunityReputation(),
  });
}

export function useCommunityNotifications() {
  return useQuery({
    queryKey: ['community-agent', 'notifications'],
    queryFn: () => communityAgentApi.getNotifications(),
  });
}

export function useCommunityAnalytics() {
  return useQuery({
    queryKey: ['community-agent', 'analytics'],
    queryFn: () => communityAgentApi.getAnalytics(),
  });
}
