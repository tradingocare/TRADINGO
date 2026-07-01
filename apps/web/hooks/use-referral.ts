import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as referralApi from '@/lib/api/referral';

export function useMyReferralCode(type?: string) {
  return useQuery({
    queryKey: ['referral', 'my-code', type],
    queryFn: () => referralApi.getMyReferralCode(type),
  });
}

export function useMyReferralCodes() {
  return useQuery({
    queryKey: ['referral', 'my-codes'],
    queryFn: referralApi.listMyReferralCodes,
  });
}

export function useReferralHistory() {
  return useQuery({
    queryKey: ['referral', 'history'],
    queryFn: referralApi.getReferralHistory,
  });
}

export function useReferralStatistics() {
  return useQuery({
    queryKey: ['referral', 'statistics'],
    queryFn: referralApi.getReferralStatistics,
  });
}

export function useCreateReferralCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: referralApi.createReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral', 'my-codes'] });
      queryClient.invalidateQueries({ queryKey: ['referral', 'my-code'] });
    },
  });
}

export function useValidateReferral() {
  return useMutation({
    mutationFn: (params: { code: string; refereeEmail?: string; ipAddress?: string; deviceId?: string }) =>
      referralApi.validateReferral(params.code, params),
  });
}

export function useAdminReferralDashboard() {
  return useQuery({
    queryKey: ['referral', 'admin', 'dashboard'],
    queryFn: referralApi.getAdminDashboard,
  });
}

export function useAdminReferrals(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['referral', 'admin', 'list', params],
    queryFn: () => referralApi.getAdminReferrals(params),
  });
}

export function useFraudAlerts() {
  return useQuery({
    queryKey: ['referral', 'admin', 'fraud'],
    queryFn: referralApi.getFraudAlerts,
  });
}

export function useBlacklist() {
  return useQuery({
    queryKey: ['referral', 'admin', 'blacklist'],
    queryFn: referralApi.getBlacklist,
  });
}

export function useAddToBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: referralApi.addToBlacklist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral', 'admin', 'blacklist'] }),
  });
}

export function useRemoveFromBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: referralApi.removeFromBlacklist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral', 'admin', 'blacklist'] }),
  });
}
