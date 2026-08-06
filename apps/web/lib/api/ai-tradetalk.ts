import api from './client';

export interface AiTradeTalkResponse<T> {
  success: boolean;
  content: T;
  provider: string;
  model: string;
  cached: boolean;
  latencyMs: number;
  cost: number;
}

export function aiCommunityCopilot(data: { communityId?: string; action?: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/copilot', data);
}

export function aiCommunitySummary(data: { communityId: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/summary', data);
}

export function aiSuggestedCommunities(data: { limit?: number; industry?: string; location?: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/suggested-communities', data);
}

export function aiSuggestedMembers(data: { communityId?: string; limit?: number; expertise?: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/suggested-members', data);
}

export function aiNetworkingSuggestions(data: { communityId: string; limit?: number }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/networking-suggestions', data);
}

export function aiDiscussionIdeas(data: { communityId: string; limit?: number }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/discussion-ideas', data);
}

export function aiCommunityInsights(data: { communityId?: string; period?: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/insights', data);
}

export function aiDashboardWidgets(data: { limit?: number }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/dashboard', data);
}

export function aiNotificationPrep(data: { communityId?: string }) {
  return api.post<AiTradeTalkResponse<any>>('/tradetalk/ai/notification-prep', data);
}
