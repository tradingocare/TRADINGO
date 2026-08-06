import { useMutation } from '@tanstack/react-query';
import {
  aiCommunityCopilot, aiCommunitySummary, aiSuggestedCommunities,
  aiSuggestedMembers, aiNetworkingSuggestions, aiDiscussionIdeas,
  aiCommunityInsights, aiDashboardWidgets, aiNotificationPrep,
} from '@/lib/api/ai-tradetalk';

export function useAiCommunityCopilot() {
  return useMutation({ mutationFn: (data: { communityId?: string; action?: string }) => aiCommunityCopilot(data) });
}

export function useAiCommunitySummary() {
  return useMutation({ mutationFn: (data: { communityId: string }) => aiCommunitySummary(data) });
}

export function useAiSuggestedCommunities() {
  return useMutation({ mutationFn: (data: { limit?: number; industry?: string; location?: string }) => aiSuggestedCommunities(data) });
}

export function useAiSuggestedMembers() {
  return useMutation({ mutationFn: (data: { communityId?: string; limit?: number; expertise?: string }) => aiSuggestedMembers(data) });
}

export function useAiNetworkingSuggestions() {
  return useMutation({ mutationFn: (data: { communityId: string; limit?: number }) => aiNetworkingSuggestions(data) });
}

export function useAiDiscussionIdeas() {
  return useMutation({ mutationFn: (data: { communityId: string; limit?: number }) => aiDiscussionIdeas(data) });
}

export function useAiCommunityInsights() {
  return useMutation({ mutationFn: (data: { communityId?: string; period?: string }) => aiCommunityInsights(data) });
}

export function useAiDashboardWidgets() {
  return useMutation({ mutationFn: (data: { limit?: number }) => aiDashboardWidgets(data) });
}

export function useAiNotificationPrep() {
  return useMutation({ mutationFn: (data: { communityId?: string }) => aiNotificationPrep(data) });
}
