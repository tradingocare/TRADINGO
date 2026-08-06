'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tradetalkApi from '@/lib/api/tradetalk';

export function useCategories() {
  return useQuery({
    queryKey: ['tradetalk', 'categories'],
    queryFn: tradetalkApi.getCategories,
  });
}

export function useDiscoverCommunities(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'communities', params],
    queryFn: () => tradetalkApi.discoverCommunities(params),
  });
}

export function useCommunity(idOrSlug: string) {
  return useQuery({
    queryKey: ['tradetalk', 'community', idOrSlug],
    queryFn: () => tradetalkApi.getCommunity(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.createCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk'] }),
  });
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idOrSlug, data }: { idOrSlug: string; data: Record<string, unknown> }) =>
      tradetalkApi.updateCommunity(idOrSlug, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk'] }),
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.deleteCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk'] }),
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, companyId }: { communityId: string; companyId?: string }) =>
      tradetalkApi.joinCommunity(communityId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'community'] });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.leaveCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'community'] });
    },
  });
}

export function useMembers(communityId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'members', communityId, params],
    queryFn: () => tradetalkApi.getMembers(communityId, params),
    enabled: !!communityId,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, userId, role }: { communityId: string; userId: string; role: string }) =>
      tradetalkApi.updateMemberRole(communityId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'members'] }),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      tradetalkApi.removeMember(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'members'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'community'] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: { email: string; role?: string; message?: string } }) =>
      tradetalkApi.inviteMember(communityId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'invitations'] }),
  });
}

export function useCommunityInvitations(communityId: string) {
  return useQuery({
    queryKey: ['tradetalk', 'invitations', communityId],
    queryFn: () => tradetalkApi.getInvitations(communityId),
    enabled: !!communityId,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, companyId }: { token: string; companyId?: string }) =>
      tradetalkApi.acceptInvitation(token, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'my-communities'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'invitations'] });
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.rejectInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'invitations'] }),
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId, communityId }: { invitationId: string; communityId: string }) =>
      tradetalkApi.cancelInvitation(invitationId, communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'invitations'] }),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: { name: string; slug: string; description?: string; icon?: string; industryId?: string; sortOrder?: number } }) =>
      tradetalkApi.createRoom(communityId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'rooms'] }),
  });
}

export function useRooms(communityId: string) {
  return useQuery({
    queryKey: ['tradetalk', 'rooms', communityId],
    queryFn: () => tradetalkApi.getRooms(communityId),
    enabled: !!communityId,
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, roomId, data }: { communityId: string; roomId: string; data: Record<string, unknown> }) =>
      tradetalkApi.updateRoom(communityId, roomId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'rooms'] }),
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, roomId }: { communityId: string; roomId: string }) =>
      tradetalkApi.deleteRoom(communityId, roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'rooms'] }),
  });
}

export function useMyCommunities() {
  return useQuery({
    queryKey: ['tradetalk', 'my-communities'],
    queryFn: tradetalkApi.getMyCommunities,
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: ['tradetalk', 'my-invitations'],
    queryFn: tradetalkApi.getMyInvitations,
  });
}

// ─── Discovery Hooks ──────────────────────────────────────────────────

export function useDiscoverFeatured(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'discover', 'featured', limit],
    queryFn: () => tradetalkApi.discoverFeatured(limit),
  });
}

export function useDiscoverTrending(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'discover', 'trending', limit],
    queryFn: () => tradetalkApi.discoverTrending(limit),
  });
}

export function useDiscoverRecommended(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'discover', 'recommended', limit],
    queryFn: () => tradetalkApi.discoverRecommended(limit),
  });
}

export function useDiscoverNearby(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'discover', 'nearby', limit],
    queryFn: () => tradetalkApi.discoverNearby(limit),
  });
}

export function useDiscoverByIndustry(industryId: string, limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'discover', 'industry', industryId, limit],
    queryFn: () => tradetalkApi.discoverByIndustry(industryId, limit),
    enabled: !!industryId,
  });
}

export function useRankings(type: string, limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'rankings', type, limit],
    queryFn: () => tradetalkApi.getRankings(type, limit),
    enabled: !!type,
  });
}

export function useFeaturedMembers(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'members', 'featured', limit],
    queryFn: () => tradetalkApi.getFeaturedMembers(limit),
  });
}

export function useCommunityLeaders(limit?: number) {
  return useQuery({
    queryKey: ['tradetalk', 'members', 'leaders', limit],
    queryFn: () => tradetalkApi.getCommunityLeaders(limit),
  });
}

export function useCommunityInsights() {
  return useQuery({
    queryKey: ['tradetalk', 'admin', 'insights'],
    queryFn: tradetalkApi.getCommunityInsights,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['tradetalk', 'dashboard-stats'],
    queryFn: tradetalkApi.getDashboardStats,
  });
}

// ═══ TradeSocial — Post Hooks ═══════════════════════════════════════════

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: tradetalkApi.CreatePostData }) =>
      tradetalkApi.createPost(communityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'community'] });
    },
  });
}

export function useCommunityPosts(communityId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'posts', communityId, params],
    queryFn: () => tradetalkApi.getCommunityPosts(communityId, params),
    enabled: !!communityId,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['tradetalk', 'post', id],
    queryFn: () => tradetalkApi.getPost(id),
    enabled: !!id,
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: tradetalkApi.UpdatePostData }) =>
      tradetalkApi.updatePost(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'post'] }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'community'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.toggleLike,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'posts'] }),
  });
}

export function usePostLikes(postId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'likes', postId, params],
    queryFn: () => tradetalkApi.getPostLikes(postId, params),
    enabled: !!postId,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.toggleBookmark,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'post'] }),
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradetalkApi.sharePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'post'] }),
  });
}

export function useTrendingPosts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'posts', 'trending', params],
    queryFn: () => tradetalkApi.getTrendingPosts(params),
  });
}

// ═══ TradeSocial — Comment Hooks ════════════════════════════════════════

export function useSendComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: tradetalkApi.SendCommentData }) =>
      tradetalkApi.sendComment(postId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'comments'] }),
  });
}

export function useComments(postId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'comments', postId, params],
    queryFn: () => tradetalkApi.getComments(postId, params),
    enabled: !!postId,
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, messageId }: { postId: string; messageId: string }) =>
      tradetalkApi.deleteComment(postId, messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradetalk', 'comments'] }),
  });
}

// ═══ TradeSocial — Follow Hooks ═════════════════════════════════════════

export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: tradetalkApi.FollowData) => tradetalkApi.follow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'follow'] });
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: tradetalkApi.FollowData) => tradetalkApi.unfollow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradetalk', 'follow'] });
    },
  });
}

export function useCheckFollow(followingId: string, followingType?: string) {
  return useQuery({
    queryKey: ['tradetalk', 'follow', 'check', followingId, followingType],
    queryFn: () => tradetalkApi.checkFollow({ followingId, followingType }),
    enabled: !!followingId,
  });
}

export function useFollowers(followingId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'follow', 'followers', followingId, params],
    queryFn: () => tradetalkApi.getFollowers(followingId, params),
    enabled: !!followingId,
  });
}

export function useFollowing(followerId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'follow', 'following', followerId, params],
    queryFn: () => tradetalkApi.getFollowing(followerId, params),
    enabled: !!followerId,
  });
}

export function useFollowCounts(followingId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['tradetalk', 'follow', 'counts', followingId, params],
    queryFn: () => tradetalkApi.getFollowCounts(followingId, params),
    enabled: !!followingId,
  });
}

// ── Phase D7: AI Content Assistance Hooks ──

export function useAiGeneratePost() {
  return useMutation({ mutationFn: tradetalkApi.aiGeneratePost });
}

export function useAiRewritePost() {
  return useMutation({ mutationFn: tradetalkApi.aiRewritePost });
}

export function useAiImproveGrammar() {
  return useMutation({ mutationFn: tradetalkApi.aiImproveGrammar });
}

export function useAiSummarizeContent() {
  return useMutation({ mutationFn: tradetalkApi.aiSummarizeContent });
}

export function useAiTranslateContent() {
  return useMutation({ mutationFn: tradetalkApi.aiTranslateContent });
}

export function useAiSuggestHashtags() {
  return useMutation({ mutationFn: tradetalkApi.aiSuggestHashtags });
}

export function useAiSuggestTitle() {
  return useMutation({ mutationFn: tradetalkApi.aiSuggestTitle });
}

// ── Phase D7: AI Moderation Hooks ──

export function useAiDetectSpam() {
  return useMutation({ mutationFn: tradetalkApi.aiDetectSpam });
}

export function useAiDetectDuplicates() {
  return useMutation({ mutationFn: tradetalkApi.aiDetectDuplicates });
}

export function useAiDetectOffensive() {
  return useMutation({ mutationFn: tradetalkApi.aiDetectOffensive });
}

export function useAiDetectUnsafeLinks() {
  return useMutation({ mutationFn: tradetalkApi.aiDetectUnsafeLinks });
}

export function useAiRecommendStatus() {
  return useMutation({ mutationFn: tradetalkApi.aiRecommendStatus });
}

// ── Phase D7: AI Insights Hooks ──

export function useAiSuggestPostingTime() {
  return useMutation({ mutationFn: tradetalkApi.aiSuggestPostingTime });
}

export function useAiSuggestCategories() {
  return useMutation({ mutationFn: tradetalkApi.aiSuggestCategories });
}

export function useAiSuggestCommunitiesForContent() {
  return useMutation({ mutationFn: tradetalkApi.aiSuggestCommunitiesForContent });
}
