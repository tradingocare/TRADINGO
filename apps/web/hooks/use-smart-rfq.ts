import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartRfqApi, type SmartRfqParams } from '@/lib/api/smart-rfq';

export function useSmartRfqs(params?: SmartRfqParams) {
  return useQuery({ queryKey: ['smart-rfqs', params], queryFn: () => smartRfqApi.list(params) });
}

export function useSmartRfq(id: string) {
  return useQuery({ queryKey: ['smart-rfqs', id], queryFn: () => smartRfqApi.getById(id), enabled: !!id });
}

export function useCreateSmartRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => smartRfqApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-rfqs'] }); } });
}

export function useDuplicateSmartRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => smartRfqApi.duplicate(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-rfqs'] }); } });
}

export function useSmartRfqSuppliers(id: string) {
  return useQuery({ queryKey: ['smart-rfq-suppliers', id], queryFn: () => smartRfqApi.findSuppliers(id), enabled: !!id });
}

export function useSmartRfqMatchingStats() {
  return useQuery({ queryKey: ['smart-rfq-matching-stats'], queryFn: () => smartRfqApi.getMatchingStats() });
}

export function useSellerIncomingRfqs(params?: SmartRfqParams) {
  return useQuery({ queryKey: ['seller-incoming-rfqs', params], queryFn: () => smartRfqApi.seller.incoming(params) });
}

export function useSellerAcceptRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (rfqId: string) => smartRfqApi.seller.accept(rfqId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-incoming-rfqs'] }); } });
}

export function useSellerDeclineRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ rfqId, reason }: { rfqId: string; reason?: string }) => smartRfqApi.seller.decline(rfqId, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-incoming-rfqs'] }); } });
}

export function useSellerRfqStats() {
  return useQuery({ queryKey: ['seller-rfq-stats'], queryFn: () => smartRfqApi.seller.stats() });
}

export function useAdminRfqOverview() {
  return useQuery({ queryKey: ['admin-rfq-overview'], queryFn: () => smartRfqApi.admin.overview() });
}

export function useAdminRfqs(params?: SmartRfqParams & { limit?: number; offset?: number }) {
  return useQuery({ queryKey: ['admin-rfqs', params], queryFn: () => smartRfqApi.admin.list(params) });
}

export function useAdminFlaggedRfqs(params?: { limit?: number; offset?: number }) {
  return useQuery({ queryKey: ['admin-flagged-rfqs', params], queryFn: () => smartRfqApi.admin.flagged(params) });
}

export function useAdminRfqAuditTrail(params?: { limit?: number; offset?: number }) {
  return useQuery({ queryKey: ['admin-rfq-audit', params], queryFn: () => smartRfqApi.admin.auditTrail(params) });
}
