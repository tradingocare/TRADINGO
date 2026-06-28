import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartPoApi } from '@/lib/api/smart-po';

const KEYS = {
  pos: 'purchase-orders',
  po: (id: string) => ['purchase-order', id],
  versions: (id: string) => ['po-versions', id],
  timeline: (id: string) => ['po-timeline', id],
  adminOverview: 'admin-po-overview',
  adminPos: 'admin-pos',
  adminFlagged: 'admin-po-flagged',
  adminAudit: 'admin-po-audit',
};

export function useMyPurchaseOrders(status?: string) {
  return useQuery({
    queryKey: [KEYS.pos, status],
    queryFn: () => smartPoApi.list({ status }),
    refetchInterval: 30000,
  });
}

export function usePurchaseOrderDetail(id: string) {
  return useQuery({
    queryKey: KEYS.po(id),
    queryFn: () => smartPoApi.getById(id),
    enabled: !!id,
  });
}

export function usePoVersions(id: string) {
  return useQuery({
    queryKey: KEYS.versions(id),
    queryFn: () => smartPoApi.getVersions(id),
    enabled: !!id,
  });
}

export function usePoTimeline(id: string) {
  return useQuery({
    queryKey: KEYS.timeline(id),
    queryFn: () => smartPoApi.getTimeline(id),
    enabled: !!id,
  });
}

export function useGeneratePo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (negotiationId: string) => smartPoApi.generate(negotiationId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEYS.pos] }); },
  });
}

export function useConfirmPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => smartPoApi.confirm(poId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

export function useAcceptPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => smartPoApi.accept(poId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

export function useRejectPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, reason }: { poId: string; reason?: string }) => smartPoApi.reject(poId, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

export function useCancelPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, reason }: { poId: string; reason?: string }) => smartPoApi.cancel(poId, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, notes }: { poId: string; notes: string }) => smartPoApi.requestRevision(poId, notes),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

export function useRevisePo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, data }: { poId: string; data: Record<string, any> }) => smartPoApi.revise(poId, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
      qc.invalidateQueries({ queryKey: KEYS.versions(res.id) });
    },
  });
}

export function useLockPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => smartPoApi.lock(poId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEYS.pos] });
      qc.invalidateQueries({ queryKey: KEYS.po(res.id) });
    },
  });
}

// ─── ADMIN ─────────────────────────────────────────────────────────

export function useAdminPoOverview() {
  return useQuery({
    queryKey: [KEYS.adminOverview],
    queryFn: () => smartPoApi.getAdminOverview(),
    refetchInterval: 30000,
  });
}

export function useAdminPos(status?: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminPos, status, limit, offset],
    queryFn: () => smartPoApi.getAdminPos({ status, limit, offset }),
  });
}

export function useAdminFlaggedPos(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminFlagged, limit, offset],
    queryFn: () => smartPoApi.getAdminFlagged({ limit, offset }),
  });
}

export function useAdminPoAudit(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [KEYS.adminAudit, limit, offset],
    queryFn: () => smartPoApi.getAdminAudit({ limit, offset }),
  });
}
