import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyAds, getMyAdStats, getAdById, createAd, updateAd, deleteAd,
  pauseAd, resumeAd, stopAd, fundAd, getAdAnalytics, getPlacements,
  recordImpression, recordClick, getAdminAds, getAdminAdDashboard,
  approveAd, rejectAd, getAdminAdById, adminPauseAd, adminResumeAd,
} from '@/lib/api/advertising';
import type { AdQueryParams, CreateAdData, UpdateAdData, AdType } from '@/lib/api/advertising';

export function useMyAds(params?: AdQueryParams) {
  return useQuery({
    queryKey: ['advertising', 'my', params],
    queryFn: () => getMyAds(params),
  });
}

export function useMyAdStats() {
  return useQuery({
    queryKey: ['advertising', 'my', 'stats'],
    queryFn: getMyAdStats,
  });
}

export function useAd(id: string | undefined) {
  return useQuery({
    queryKey: ['advertising', id],
    queryFn: () => getAdById(id!),
    enabled: !!id,
  });
}

export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdData) => createAd(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdData }) => updateAd(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function usePauseAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pauseAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function useResumeAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function useStopAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stopAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertising'] }); },
  });
}

export function useFundAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => fundAd(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advertising'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useAdAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: ['advertising', id, 'analytics'],
    queryFn: () => getAdAnalytics(id!),
    enabled: !!id,
  });
}

export function usePlacements(type: AdType, limit = 10) {
  return useQuery({
    queryKey: ['advertising', 'placements', type, limit],
    queryFn: () => getPlacements(type, limit),
  });
}

export function useRecordImpression() {
  return useMutation({ mutationFn: (id: string) => recordImpression(id) });
}

export function useRecordClick() {
  return useMutation({ mutationFn: (id: string) => recordClick(id) });
}

export function useAdminAds(params?: AdQueryParams) {
  return useQuery({
    queryKey: ['admin', 'advertising', params],
    queryFn: () => getAdminAds(params),
  });
}

export function useAdminAdDashboard() {
  return useQuery({
    queryKey: ['admin', 'advertising', 'dashboard'],
    queryFn: getAdminAdDashboard,
  });
}

export function useApproveAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'advertising'] }); },
  });
}

export function useRejectAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAd(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'advertising'] }); },
  });
}

export function useAdminAd(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'advertising', id],
    queryFn: () => getAdminAdById(id!),
    enabled: !!id,
  });
}

export function useAdminPauseAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminPauseAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'advertising'] }); },
  });
}

export function useAdminResumeAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminResumeAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'advertising'] }); },
  });
}
