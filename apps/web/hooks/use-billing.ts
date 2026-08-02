import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as billingApi from '@/lib/api/billing';

export function useRevenueKpis() { return useQuery({ queryKey: ['analytics', 'revenue-kpis'], queryFn: () => billingApi.getRevenueKpis() }); }
export function useSubscriptionMetrics() { return useQuery({ queryKey: ['analytics', 'subscription-metrics'], queryFn: () => billingApi.getSubscriptionMetrics() }); }
export function useRevenueOverview() { return useQuery({ queryKey: ['billing', 'revenue-overview'], queryFn: () => billingApi.getRevenueOverview() }); }
export function useAllSubscriptions(params?: any) { return useQuery({ queryKey: ['admin', 'subscriptions', params], queryFn: () => billingApi.getAllSubscriptions(params) }); }
export function useSubscriptionSummary() { return useQuery({ queryKey: ['admin', 'subscriptions', 'summary'], queryFn: () => billingApi.getSubscriptionSummary() }); }
export function useProration(companyId: string, newPlanPrice: number) { return useQuery({ queryKey: ['billing', 'prorate', companyId, newPlanPrice], queryFn: () => billingApi.calculateProration(companyId, newPlanPrice), enabled: !!companyId && newPlanPrice > 0 }); }
export function useGetSubscriptionDetail() { return useQuery({ queryKey: ['membership', 'detail'], queryFn: () => billingApi.getSubscriptionDetail() }); }

export function useProcessExpiredSubscriptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.processExpiredSubscriptions(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] }); },
  });
}

export function useEnrollTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => billingApi.enrollTrial(planId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}

export function useUpgradeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { newPlanId: string; planTier: string; amount: number; paymentId: string }) =>
      billingApi.upgradeSubscription(params.newPlanId, params.planTier, params.amount, params.paymentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}

export function useDowngradeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { newPlanId: string; effectiveAt?: string }) =>
      billingApi.downgradeSubscription(params.newPlanId, params.effectiveAt),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}

export function useRenewSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { amount: number; paymentId: string }) =>
      billingApi.renewSubscription(params.amount, params.paymentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}

export function useSuspendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => billingApi.suspendSubscription(reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}

export function useReactivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.reactivateSubscription(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membership', 'detail'] }); },
  });
}
