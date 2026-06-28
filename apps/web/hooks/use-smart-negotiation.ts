import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartNegotiationApi } from '@/lib/api/smart-negotiation';

const KEYS = {
  negotiations: 'negotiations',
  negotiation: (id: string) => ['negotiation', id],
  versions: (id: string) => ['negotiation-versions', id],
  timeline: (id: string) => ['negotiation-timeline', id],
  adminOverview: 'admin-negotiation-overview',
  adminNegotiations: 'admin-negotiations',
  adminFlagged: 'admin-negotiation-flagged',
  adminAudit: 'admin-negotiation-audit',
};

export function useMyNegotiations(status?: string) {
  return useQuery({
    queryKey: [KEYS.negotiations, status],
    queryFn: () => smartNegotiationApi.list({ status }),
    refetchInterval: 30000,
  });
}

export function useNegotiationDetail(id: string) {
  return useQuery({
    queryKey: KEYS.negotiation(id),
    queryFn: () => smartNegotiationApi.getById(id),
    enabled: !!id,
  });
}

export function useNegotiationVersions(id: string) {
  return useQuery({
    queryKey: KEYS.versions(id),
    queryFn: () => smartNegotiationApi.getVersions(id),
    enabled: !!id,
  });
}

export function useNegotiationTimeline(id: string) {
  return useQuery({
    queryKey: KEYS.timeline(id),
    queryFn: () => smartNegotiationApi.getTimeline(id),
    enabled: !!id,
  });
}

export function useStartNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quoteId, data }: { quoteId: string; data?: { notes?: string } }) =>
      smartNegotiationApi.start(quoteId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEYS.negotiations] }); },
  });
}

export function useCounterOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ negotiationId, data }: { negotiationId: string; data: Record<string, any> }) =>
      smartNegotiationApi.counter(negotiationId, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.negotiations] });
      qc.invalidateQueries({ queryKey: KEYS.negotiation(res.id) });
      qc.invalidateQueries({ queryKey: KEYS.versions(res.id) });
      qc.invalidateQueries({ queryKey: KEYS.timeline(res.id) });
    },
  });
}

export function useAcceptNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (negotiationId: string) => smartNegotiationApi.accept(negotiationId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.negotiations] });
      qc.invalidateQueries({ queryKey: KEYS.negotiation(res.id) });
      qc.invalidateQueries({ queryKey: KEYS.timeline(res.id) });
    },
  });
}

export function useRejectNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ negotiationId, reason }: { negotiationId: string; reason?: string }) =>
      smartNegotiationApi.reject(negotiationId, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.negotiations] });
      qc.invalidateQueries({ queryKey: KEYS.negotiation(res.id) });
      qc.invalidateQueries({ queryKey: KEYS.timeline(res.id) });
    },
  });
}

export function useCancelNegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ negotiationId, reason }: { negotiationId: string; reason?: string }) =>
      smartNegotiationApi.cancel(negotiationId, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.negotiations] });
      qc.invalidateQueries({ queryKey: KEYS.negotiation(res.id) });
    },
  });
}

// ─── ADMIN ─────────────────────────────────────────────────────────

export function useAdminNegotiationOverview() {
  return useQuery({
    queryKey: [KEYS.adminOverview],
    queryFn: () => smartNegotiationApi.getAdminOverview(),
    refetchInterval: 30000,
  });
}

export function useAdminNegotiations(status?: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminNegotiations, status, limit, offset],
    queryFn: () => smartNegotiationApi.getAdminNegotiations({ status, limit, offset }),
  });
}

export function useAdminFlaggedNegotiations(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminFlagged, limit, offset],
    queryFn: () => smartNegotiationApi.getAdminFlagged({ limit, offset }),
  });
}

export function useAdminNegotiationAudit(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminAudit, limit, offset],
    queryFn: () => smartNegotiationApi.getAdminAudit({ limit, offset }),
  });
}
