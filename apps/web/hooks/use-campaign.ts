import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as campaignApi from '@/lib/api/campaign';

export function useCampaigns(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['campaigns', 'list', params],
    queryFn: () => campaignApi.getCampaigns(params),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignApi.getCampaign(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.createCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Parameters<typeof campaignApi.updateCampaign>[1]> }) =>
      campaignApi.updateCampaign(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.deleteCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useCloneCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.cloneCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.pauseCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.resumeCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.archiveCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: campaignApi.getActiveCampaigns,
  });
}

export function useCampaignsByType(type: string) {
  return useQuery({
    queryKey: ['campaigns', 'by-type', type],
    queryFn: () => campaignApi.getCampaignsByType(type),
    enabled: !!type,
  });
}

export function useCheckEligibility() {
  return useMutation({
    mutationFn: ({ campaignId, companyId }: { campaignId: string; companyId?: string }) =>
      campaignApi.checkEligibility(campaignId, companyId),
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.claimReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my-claims'] });
      queryClient.invalidateQueries({ queryKey: ['gocash'] });
    },
  });
}

export function useMyClaims() {
  return useQuery({
    queryKey: ['campaigns', 'my-claims'],
    queryFn: campaignApi.getMyClaims,
  });
}

export function useAdminCampaignDashboard() {
  return useQuery({
    queryKey: ['campaigns', 'admin', 'dashboard'],
    queryFn: campaignApi.getAdminCampaignDashboard,
  });
}

export function useSellerCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'seller'],
    queryFn: campaignApi.getSellerCampaigns,
  });
}

export function useCampaignAnalytics(id: string) {
  return useQuery({
    queryKey: ['campaigns', id, 'analytics'],
    queryFn: () => campaignApi.getCampaignAnalytics(id),
    enabled: !!id,
  });
}
