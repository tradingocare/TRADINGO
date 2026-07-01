import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrustScore,
  getUnifiedScore,
  getScoreBreakdown,
  getScoreHistory,
  getTrustStats,
  recalculateScore,
  recalculateAllScores,
  recalculateUserScore,
} from '@/lib/api/tradtrust';

export function useTrustScore(companyId: string) {
  return useQuery({
    queryKey: ['tradtrust', 'score', companyId],
    queryFn: () => getTrustScore(companyId),
    enabled: !!companyId,
  });
}

export function useUnifiedScore(companyId: string) {
  return useQuery({
    queryKey: ['tradtrust', 'unified', companyId],
    queryFn: () => getUnifiedScore(companyId),
    enabled: !!companyId,
  });
}

export function useScoreBreakdown(companyId: string) {
  return useQuery({
    queryKey: ['tradtrust', 'breakdown', companyId],
    queryFn: () => getScoreBreakdown(companyId),
    enabled: !!companyId,
  });
}

export function useScoreHistory(companyId: string, limit?: number) {
  return useQuery({
    queryKey: ['tradtrust', 'history', companyId, limit],
    queryFn: () => getScoreHistory(companyId, limit),
    enabled: !!companyId,
  });
}

export function useTrustStats() {
  return useQuery({
    queryKey: ['tradtrust', 'stats'],
    queryFn: getTrustStats,
  });
}

export function useRecalculateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => recalculateScore(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradtrust'] });
    },
  });
}

export function useRecalculateAllScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recalculateAllScores,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradtrust'] });
    },
  });
}

export function useRecalculateUserScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => recalculateUserScore(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradtrust'] });
    },
  });
}
