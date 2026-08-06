import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ecosystemApi from '@/lib/api/ecosystem';

export function useEcosystemDashboard() {
  return useQuery({ queryKey: ['ecosystem', 'dashboard'], queryFn: ecosystemApi.getEcosystemDashboard });
}

export function useXpBalance() {
  return useQuery({ queryKey: ['ecosystem', 'xp', 'balance'], queryFn: ecosystemApi.getXpBalance });
}

export function useXpHistory(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['ecosystem', 'xp', 'history', params], queryFn: () => ecosystemApi.getXpHistory(params) });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ecosystemApi.dailyCheckin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ecosystem', 'dashboard'] });
      qc.invalidateQueries({ queryKey: ['ecosystem', 'streaks'] });
    },
  });
}

export function useCheckinHistory(params?: { month?: number; year?: number }) {
  return useQuery({ queryKey: ['ecosystem', 'checkin', 'history', params], queryFn: () => ecosystemApi.getCheckinHistory(params) });
}

export function useStreaks() {
  return useQuery({ queryKey: ['ecosystem', 'streaks'], queryFn: ecosystemApi.getStreaks });
}

export function useEcosystemLevels() {
  return useQuery({ queryKey: ['ecosystem', 'levels'], queryFn: ecosystemApi.getEcosystemLevels });
}

export function useBadges(includeInactive?: boolean) {
  return useQuery({ queryKey: ['ecosystem', 'badges', includeInactive], queryFn: () => ecosystemApi.getBadges(includeInactive) });
}

export function useUserBadges() {
  return useQuery({ queryKey: ['ecosystem', 'badges', 'mine'], queryFn: ecosystemApi.getUserBadges });
}

export function useMissions(period?: string) {
  return useQuery({ queryKey: ['ecosystem', 'missions', period], queryFn: () => ecosystemApi.getMissions(period) });
}

export function useUserMissions(status?: string) {
  return useQuery({ queryKey: ['ecosystem', 'missions', 'mine', status], queryFn: () => ecosystemApi.getUserMissions(status) });
}

export function useAchievements() {
  return useQuery({ queryKey: ['ecosystem', 'achievements'], queryFn: ecosystemApi.getAchievements });
}

export function useUserAchievements(status?: string) {
  return useQuery({ queryKey: ['ecosystem', 'achievements', 'mine', status], queryFn: () => ecosystemApi.getUserAchievements(status) });
}

export function useAiIntelligence() {
  return useQuery({ queryKey: ['ecosystem', 'ai-intelligence'], queryFn: ecosystemApi.getAiIntelligence });
}

export function useEcoAdminDashboard() {
  return useQuery({ queryKey: ['ecosystem', 'admin', 'dashboard'], queryFn: ecosystemApi.getEcoAdminDashboard });
}

export function useEcoAdminXpChart(days?: number) {
  return useQuery({ queryKey: ['ecosystem', 'admin', 'xp-chart', days], queryFn: () => ecosystemApi.getEcoAdminXpChart(days) });
}
