import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserVerifications,
  getMyUserVerifications,
  submitUserVerification,
  reviewUserVerification,
  getReputationEvents,
  getReputationSummary,
} from '@/lib/api/user-verification';

export function useUserVerifications(params?: { status?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: ['user-verifications', params],
    queryFn: () => getUserVerifications(params),
  });
}

export function useMyUserVerifications() {
  return useQuery({
    queryKey: ['user-verifications', 'my'],
    queryFn: getMyUserVerifications,
  });
}

export function useSubmitUserVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitUserVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
    },
  });
}

export function useReviewUserVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      reviewUserVerification(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
    },
  });
}

export function useReputationEvents(userId: string) {
  return useQuery({
    queryKey: ['reputation', 'events', userId],
    queryFn: () => getReputationEvents(userId),
    enabled: !!userId,
  });
}

export function useReputationSummary(userId: string) {
  return useQuery({
    queryKey: ['reputation', 'summary', userId],
    queryFn: () => getReputationSummary(userId),
    enabled: !!userId,
  });
}
