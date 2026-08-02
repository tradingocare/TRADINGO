import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface EcosystemLevel {
  id: string;
  name: string;
  levelNumber: number;
  minXP: number;
  maxXP: number;
  badgeIcon: string | null;
  badgeColor: string | null;
  benefits: any;
  rewards: any;
  sortOrder: number;
}

export interface EcosystemUserLevel {
  totalXP: number;
  currentLevel: EcosystemLevel;
  maxLevelReached: string;
  lastLevelUpAt: string | null;
}

export interface EcosystemDashboard {
  level: EcosystemLevel;
  totalXp: number;
  nextLevelXp: number;
  badges: number;
  achievements: number;
  completedMissions: number;
  activeMissions: number;
  streaks: { streakType: string; currentCount: number; maxCount: number }[];
  checkedInToday: boolean;
  currentStreak: number;
  recentXp: XpTransaction[];
  todayXp: number;
  todayRewards: number;
  todayMission: string | null;
  recommendedAction: string;
  businessImpact: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  multiplier: number;
  metadata: any;
  createdAt: string;
}

export interface EcosystemBadge {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: string | null;
  criteria: any;
  rewards: any;
  sortOrder: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: EcosystemBadge;
  earnedAt: string;
}

export interface EcosystemMission {
  id: string;
  name: string;
  description: string | null;
  period: string;
  actionType: string;
  targetCount: number;
  xpReward: number;
  gocashReward: string | null;
  badgeId: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  userProgress: UserMission | null;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  mission: EcosystemMission;
  progress: number;
  targetCount: number;
  status: string;
  completedAt: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface EcosystemAchievement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: string | null;
  criteria: any;
  xpReward: number;
  gocashReward: string | null;
  badgeId: string | null;
  sortOrder: number;
  hidden: boolean;
  userProgress: UserAchievement | null;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: EcosystemAchievement;
  progress: number;
  targetCount: number;
  status: string;
  completedAt: string | null;
}

export interface AiIntelligence {
  level: string;
  totalXp: number;
  nextLevelXp: number;
  progress: number;
  xpBreakdown: { reason: string; _sum: { amount: number }; _count: number }[];
  streaks: { type: string; current: number; max: number }[];
  recommendations: string[];
}

export interface EcoCheckinResult {
  streakCount: number;
  bonusEarned: boolean;
}

export interface EcoAdminDashboard {
  totalUsers: number;
  totalXp: number;
  totalCheckins: number;
  totalBadges: number;
  totalMissions: number;
  totalAchievements: number;
}

export interface EcoAdminXpChart {
  date: string;
  amount: number;
}

export interface EcoUserSummary {
  level: EcosystemLevel;
  totalXp: number;
  badges: UserBadge[];
  achievements: UserAchievement[];
  activeMissions: UserMission[];
  streaks: { streakType: string; currentCount: number; maxCount: number }[];
  recentXp: XpTransaction[];
}

export function getEcosystemDashboard() {
  return apiClient.get<EcosystemDashboard>('/ecosystem/dashboard').then(r => r.data);
}

export function getXpBalance() {
  return apiClient.get<EcosystemUserLevel>('/ecosystem/xp/balance').then(r => r.data);
}

export function getXpHistory(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<XpTransaction>>('/ecosystem/xp/history', { params }).then(r => r.data);
}

export function dailyCheckin() {
  return apiClient.post<EcoCheckinResult>('/ecosystem/checkin').then(r => r.data);
}

export function getCheckinHistory(params?: { month?: number; year?: number }) {
  return apiClient.get<any[]>('/ecosystem/checkin/history', { params }).then(r => r.data);
}

export function getStreaks() {
  return apiClient.get<any[]>('/ecosystem/streaks').then(r => r.data);
}

export function getEcosystemLevels() {
  return apiClient.get<EcosystemLevel[]>('/ecosystem/levels').then(r => r.data);
}

export function getBadges(includeInactive?: boolean) {
  return apiClient.get<EcosystemBadge[]>('/ecosystem/badges', { params: { includeInactive: includeInactive ? 'true' : undefined } }).then(r => r.data);
}

export function getUserBadges() {
  return apiClient.get<UserBadge[]>('/ecosystem/badges/mine').then(r => r.data);
}

export function getMissions(period?: string) {
  return apiClient.get<EcosystemMission[]>('/ecosystem/missions', { params: { period } }).then(r => r.data);
}

export function getUserMissions(status?: string) {
  return apiClient.get<UserMission[]>('/ecosystem/missions/mine', { params: { status } }).then(r => r.data);
}

export function getAchievements() {
  return apiClient.get<EcosystemAchievement[]>('/ecosystem/achievements').then(r => r.data);
}

export function getUserAchievements(status?: string) {
  return apiClient.get<UserAchievement[]>('/ecosystem/achievements/mine', { params: { status } }).then(r => r.data);
}

export function getAiIntelligence() {
  return apiClient.get<AiIntelligence>('/ecosystem/ai-intelligence').then(r => r.data);
}

export function getUserSummary(userId: string) {
  return apiClient.get<EcoUserSummary>(`/ecosystem/summary/${userId}`).then(r => r.data);
}

export function getEcoAdminDashboard() {
  return apiClient.get<EcoAdminDashboard>('/admin/ecosystem/dashboard').then(r => r.data);
}

export function getEcoAdminXpChart(days?: number) {
  return apiClient.get<EcoAdminXpChart[]>('/admin/ecosystem/xp-chart', { params: { days } }).then(r => r.data);
}

export function ecoSeedData() {
  return apiClient.post('/admin/ecosystem/seed').then(r => r.data);
}
