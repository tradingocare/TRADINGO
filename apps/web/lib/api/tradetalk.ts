import { apiClient } from './client';

export interface CommunityCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IndustryRoom {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  industryId?: string;
  sortOrder: number;
  isActive: boolean;
  memberCount: number;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  companyId?: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';
  joinedAt: string;
  invitedById?: string;
  lastActiveAt?: string;
  user?: { id: string; name: string; email: string };
}

export interface CommunityInvitation {
  id: string;
  communityId: string;
  invitedById: string;
  email: string;
  token: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  message?: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { id: string; name: string; email: string };
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  rules?: string;
  logo?: string;
  banner?: string;
  categoryId?: string;
  category?: CommunityCategory;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  joinSetting: 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY';
  ownerId: string;
  companyId?: string;
  tags: string[];
  memberCount: number;
  roomCount: number;
  postCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  rooms?: IndustryRoom[];
  _count?: { members: number; rooms: number };
}

export interface MyCommunity {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  community: Community;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function getCategories() {
  return apiClient.get<CommunityCategory[]>('/tradetalk/categories').then((r) => r.data);
}

export function discoverCommunities(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<Community>>('/tradetalk/communities', { params }).then((r) => r.data);
}

export function getCommunity(idOrSlug: string) {
  return apiClient.get<Community>(`/tradetalk/communities/${idOrSlug}`).then((r) => r.data);
}

export function createCommunity(data: {
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  logo?: string;
  banner?: string;
  categoryId?: string;
  visibility?: string;
  joinSetting?: string;
  companyId?: string;
  rules?: string;
  tags?: string[];
}) {
  return apiClient.post<Community>('/tradetalk/communities', data).then((r) => r.data);
}

export function updateCommunity(idOrSlug: string, data: Record<string, unknown>) {
  return apiClient.patch<Community>(`/tradetalk/communities/${idOrSlug}`, data).then((r) => r.data);
}

export function deleteCommunity(idOrSlug: string) {
  return apiClient.delete(`/tradetalk/communities/${idOrSlug}`);
}

export function joinCommunity(communityId: string, companyId?: string) {
  return apiClient.post(`/tradetalk/communities/${communityId}/join`, { companyId }).then((r) => r.data);
}

export function leaveCommunity(communityId: string) {
  return apiClient.post(`/tradetalk/communities/${communityId}/leave`).then((r) => r.data);
}

export function getMembers(communityId: string, params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<CommunityMember>>(`/tradetalk/communities/${communityId}/members`, { params }).then((r) => r.data);
}

export function updateMemberRole(communityId: string, userId: string, role: string) {
  return apiClient.patch(`/tradetalk/communities/${communityId}/members/${userId}`, { role }).then((r) => r.data);
}

export function removeMember(communityId: string, userId: string) {
  return apiClient.delete(`/tradetalk/communities/${communityId}/members/${userId}`);
}

export function inviteMember(communityId: string, data: { email: string; role?: string; message?: string }) {
  return apiClient.post(`/tradetalk/communities/${communityId}/invite`, data).then((r) => r.data);
}

export function getInvitations(communityId: string) {
  return apiClient.get<CommunityInvitation[]>(`/tradetalk/communities/${communityId}/invitations`).then((r) => r.data);
}

export function acceptInvitation(token: string, companyId?: string) {
  return apiClient.post(`/tradetalk/invitations/${token}/accept`, { companyId }).then((r) => r.data);
}

export function rejectInvitation(token: string) {
  return apiClient.post(`/tradetalk/invitations/${token}/reject`).then((r) => r.data);
}

export function cancelInvitation(invitationId: string, communityId: string) {
  return apiClient.delete(`/tradetalk/invitations/${invitationId}`, { data: { communityId } });
}

export function createRoom(communityId: string, data: { name: string; slug: string; description?: string; icon?: string; industryId?: string; sortOrder?: number }) {
  return apiClient.post(`/tradetalk/communities/${communityId}/rooms`, data).then((r) => r.data);
}

export function getRooms(communityId: string) {
  return apiClient.get<IndustryRoom[]>(`/tradetalk/communities/${communityId}/rooms`).then((r) => r.data);
}

export function updateRoom(communityId: string, roomId: string, data: Record<string, unknown>) {
  return apiClient.patch(`/tradetalk/communities/${communityId}/rooms/${roomId}`, data).then((r) => r.data);
}

export function deleteRoom(communityId: string, roomId: string) {
  return apiClient.delete(`/tradetalk/communities/${communityId}/rooms/${roomId}`);
}

export function getMyCommunities() {
  return apiClient.get<MyCommunity[]>('/tradetalk/my-communities').then((r) => r.data);
}

export interface MyInvitation {
  id: string;
  community: { id: string; name: string; slug: string; description?: string; memberCount: number; logo?: string };
  invitedBy: { id: string; name: string };
  token: string;
  createdAt: string;
}

export function getMyInvitations() {
  return apiClient.get<MyInvitation[]>('/tradetalk/my-invitations').then((r) => r.data);
}

// ─── Discovery ──────────────────────────────────────────────────────────

export interface RankingCommunity extends Community {
  company?: { id: string; name: string; slug: string; trustScore?: number };
}

export interface FeaturedMember {
  id: string;
  communityId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user?: { id: string; name: string; email: string; verificationLevel?: string };
  community?: { id: string; name: string; slug: string };
}

export interface CommunityLeader {
  userId: string;
  communityCount: number;
  user: { id: string; name: string; email: string; verificationLevel?: string } | null;
  primaryCompany?: { id: string; name: string; slug: string; trustScore?: number } | null;
}

export interface IndustryDistribution {
  industryId: string;
  count: number;
  industryName?: string;
}

export interface CategoryDistribution {
  categoryId: string;
  count: number;
  categoryName?: string;
}

export interface CommunityInsights {
  totalCommunities: number;
  totalMembers: number;
  communityGrowth30d: number;
  memberGrowth30d: number;
  pendingInvitations: number;
  industryDistribution: IndustryDistribution[];
  categoryDistribution: CategoryDistribution[];
}

export interface TrendingIndustry {
  industryId: string;
  roomCount: number;
  industry: { id: string; name: string; slug: string } | null;
}

export interface DashboardStats {
  recommended: Community[];
  pendingInvitationsCount: number;
  trendingIndustries: TrendingIndustry[];
  myCommunityCount: number;
  totalMembersAcrossCommunities: number;
  myCommunities: Community[];
}

export function discoverFeatured(limit?: number) {
  return apiClient.get<Community[]>('/tradetalk/discover/featured', { params: { limit } }).then((r) => r.data);
}

export function discoverTrending(limit?: number) {
  return apiClient.get<Community[]>('/tradetalk/discover/trending', { params: { limit } }).then((r) => r.data);
}

export function discoverRecommended(limit?: number) {
  return apiClient.get<Community[]>('/tradetalk/discover/recommended', { params: { limit } }).then((r) => r.data);
}

export function discoverNearby(limit?: number) {
  return apiClient.get<Community[]>('/tradetalk/discover/nearby', { params: { limit } }).then((r) => r.data);
}

export function discoverByIndustry(industryId: string, limit?: number) {
  return apiClient.get<Community[]>(`/tradetalk/discover/industry/${industryId}`, { params: { limit } }).then((r) => r.data);
}

export function getRankings(type: string, limit?: number) {
  return apiClient.get<(Community | RankingCommunity)[]>('/tradetalk/rankings', { params: { type, limit } }).then((r) => r.data);
}

export function getFeaturedMembers(limit?: number) {
  return apiClient.get<FeaturedMember[]>('/tradetalk/members/featured', { params: { limit } }).then((r) => r.data);
}

export function getCommunityLeaders(limit?: number) {
  return apiClient.get<CommunityLeader[]>('/tradetalk/members/leaders', { params: { limit } }).then((r) => r.data);
}

export function getCommunityInsights() {
  return apiClient.get<CommunityInsights>('/admin/tradetalk/insights').then((r) => r.data);
}

export function getDashboardStats() {
  return apiClient.get<DashboardStats>('/tradetalk/dashboard-stats').then((r) => r.data);
}

// ═══ TradeSocial — Post Interfaces ══════════════════════════════════════

export interface SocialPost {
  id: string;
  communityId: string;
  roomId?: string;
  authorId: string;
  companyId?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'POLL' | 'MILESTONE';
  title?: string;
  content: string;
  mediaUrls: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; email: string };
  community?: { id: string; name: string; slug: string };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface CreatePostData {
  content: string;
  title?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'POLL' | 'MILESTONE';
  mediaUrls?: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  roomId?: string;
}

export interface UpdatePostData {
  content?: string;
  title?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'POLL' | 'MILESTONE';
  mediaUrls?: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  roomId?: string;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface BookmarkResponse {
  bookmarked: boolean;
}

export interface ShareResponse {
  shareCount: number;
}

// ═══ TradeSocial — Post API Functions ═══════════════════════════════════

export function createPost(communityId: string, data: CreatePostData) {
  return apiClient.post<SocialPost>(`/tradetalk/communities/${communityId}/posts`, data).then((r) => r.data);
}

export function getCommunityPosts(communityId: string, params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<SocialPost>>(`/tradetalk/communities/${communityId}/posts`, { params }).then((r) => r.data);
}

export function getPost(id: string) {
  return apiClient.get<SocialPost>(`/tradetalk/posts/${id}`).then((r) => r.data);
}

export function updatePost(id: string, data: UpdatePostData) {
  try { fetch('/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'post_edited', properties: { postId: id } }) }); } catch {}
  return apiClient.patch<SocialPost>(`/tradetalk/posts/${id}`, data).then((r) => r.data);
}

export function deletePost(id: string) {
  return apiClient.delete(`/tradetalk/posts/${id}`);
}

export function toggleLike(id: string) {
  return apiClient.post<LikeResponse>(`/tradetalk/posts/${id}/like`).then((r) => r.data);
}

export function getPostLikes(id: string, params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<{ id: string; name: string; email: string }>>(`/tradetalk/posts/${id}/likes`, { params }).then((r) => r.data);
}

export function toggleBookmark(id: string) {
  return apiClient.post<BookmarkResponse>(`/tradetalk/posts/${id}/bookmark`).then((r) => r.data);
}

export function sharePost(id: string) {
  return apiClient.post<ShareResponse>(`/tradetalk/posts/${id}/share`).then((r) => r.data);
}

export function getTrendingPosts(params?: Record<string, unknown>) {
  return apiClient.get<SocialPost[]>('/tradetalk/posts/trending', { params }).then((r) => r.data);
}

export function togglePinPost(postId: string, pinned: boolean) {
  return apiClient.post(`/tradetalk/posts/${postId}/pin`, { pinned });
}

export function getCommunityActivity(communityId: string, params?: Record<string, unknown>) {
  return apiClient.get(`/tradetalk/communities/${communityId}/activity`, { params }).then((r) => r.data);
}

// ═══ TradeSocial — Comment Interfaces ═══════════════════════════════════

export interface Comment {
  id: string;
  content: string;
  type: string;
  replyToId?: string;
  replyTo?: { id: string; content: string; senderId: string; createdAt: string } | null;
  createdAt: string;
  sender: { id: string; name: string; email: string } | null;
  isOwn: boolean;
}

export interface CommentsResponse {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SendCommentData {
  content: string;
  replyToId?: string;
}

// ═══ TradeSocial — Comment API Functions ════════════════════════════════

export function sendComment(postId: string, data: SendCommentData) {
  return apiClient.post<Comment>(`/tradetalk/posts/${postId}/comments`, data).then((r) => r.data);
}

export function getComments(postId: string, params?: Record<string, unknown>) {
  return apiClient.get<CommentsResponse>(`/tradetalk/posts/${postId}/comments`, { params }).then((r) => r.data);
}

export function deleteComment(postId: string, messageId: string) {
  return apiClient.delete(`/tradetalk/posts/${postId}/comments/${messageId}`);
}

// ═══ TradeSocial — Follow Interfaces ════════════════════════════════════

export interface FollowUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  followedAt: string;
}

export interface FollowListResponse {
  items: FollowUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FollowToggleResponse {
  following: boolean;
}

export interface FollowCheckResponse {
  following: boolean;
}

export interface FollowCountsResponse {
  followers: number;
  following: number;
}

export interface FollowData {
  followingId: string;
  followingType?: 'USER' | 'COMPANY';
}

// ═══ TradeSocial — Follow API Functions ═════════════════════════════════

export function follow(data: FollowData) {
  return apiClient.post<FollowToggleResponse>('/tradetalk/follow', data).then((r) => r.data);
}

export function unfollow(data: FollowData) {
  return apiClient.post<FollowToggleResponse>('/tradetalk/unfollow', data).then((r) => r.data);
}

export function checkFollow(params: { followingId: string; followingType?: string }) {
  return apiClient.get<FollowCheckResponse>('/tradetalk/follow/check', { params }).then((r) => r.data);
}

export function getFollowers(followingId: string, params?: Record<string, unknown>) {
  return apiClient.get<FollowListResponse>(`/tradetalk/follow/followers/${followingId}`, { params }).then((r) => r.data);
}

export function getFollowing(followerId: string, params?: Record<string, unknown>) {
  return apiClient.get<FollowListResponse>(`/tradetalk/follow/following/${followerId}`, { params }).then((r) => r.data);
}

export function getFollowCounts(followingId: string, params?: Record<string, unknown>) {
  return apiClient.get<FollowCountsResponse>(`/tradetalk/follow/counts/${followingId}`, { params }).then((r) => r.data);
}

// ── Phase D7: AI Content Assistance ──

export function aiGeneratePost(data: { topic: string; tone?: string; audience?: string; keywords?: string }) {
  return apiClient.post('/tradetalk/ai/generate-post', data).then((r) => r.data);
}

export function aiRewritePost(data: { content: string; style?: string; audience?: string }) {
  return apiClient.post('/tradetalk/ai/rewrite-post', data).then((r) => r.data);
}

export function aiImproveGrammar(data: { content: string }) {
  return apiClient.post('/tradetalk/ai/improve-grammar', data).then((r) => r.data);
}

export function aiSummarizeContent(data: { content: string; maxLength?: number }) {
  return apiClient.post('/tradetalk/ai/summarize', data).then((r) => r.data);
}

export function aiTranslateContent(data: { content: string; targetLanguage: string; sourceLanguage?: string }) {
  return apiClient.post('/tradetalk/ai/translate', data).then((r) => r.data);
}

export function aiSuggestHashtags(data: { content: string; maxCount?: number }) {
  return apiClient.post('/tradetalk/ai/suggest-hashtags', data).then((r) => r.data);
}

export function aiSuggestTitle(data: { content: string }) {
  return apiClient.post('/tradetalk/ai/suggest-title', data).then((r) => r.data);
}

// ── Phase D7: AI Moderation ──

export function aiDetectSpam(data: { content: string; communityId?: string }) {
  return apiClient.post('/tradetalk/ai/detect-spam', data).then((r) => r.data);
}

export function aiDetectDuplicates(data: { content: string; communityId?: string }) {
  return apiClient.post('/tradetalk/ai/detect-duplicates', data).then((r) => r.data);
}

export function aiDetectOffensive(data: { content: string }) {
  return apiClient.post('/tradetalk/ai/detect-offensive', data).then((r) => r.data);
}

export function aiDetectUnsafeLinks(data: { content: string; linkUrl?: string }) {
  return apiClient.post('/tradetalk/ai/detect-unsafe-links', data).then((r) => r.data);
}

export function aiRecommendStatus(data: { content: string; communityId?: string }) {
  return apiClient.post('/tradetalk/ai/recommend-status', data).then((r) => r.data);
}

// ── Phase D7: AI Insights ──

export function aiSuggestPostingTime(data: { communityId?: string }) {
  return apiClient.post('/tradetalk/ai/suggest-posting-time', data).then((r) => r.data);
}

export function aiSuggestCategories(data: { content: string }) {
  return apiClient.post('/tradetalk/ai/suggest-categories', data).then((r) => r.data);
}

export function aiSuggestCommunitiesForContent(data: { content: string; excludeIds?: string[] }) {
  return apiClient.post('/tradetalk/ai/suggest-communities-for-content', data).then((r) => r.data);
}
