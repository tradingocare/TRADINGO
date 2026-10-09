import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRfqs, getRfq, createRfq, updateRfq, getAdminRfqs, getSellerIncomingRfqs, type GetRfqsParams } from '@/lib/api/rfqs';
import type { Rfq } from '@/lib/api/types';

export function useRfqs(params?: GetRfqsParams) {
  return useQuery({
    queryKey: ['rfqs', params],
    queryFn: () => getRfqs(params),
  });
}

// Canonical role-scoped lists (Batch B): admin pages use the admin endpoint,
// seller pages use the incoming endpoint — both from smart-rfq.controller.ts.
export function useAdminRfqsList(params?: GetRfqsParams) {
  return useQuery({
    queryKey: ['admin-rfqs-list', params],
    queryFn: () => getAdminRfqs(params),
  });
}

export function useSellerIncomingRfqsList(params?: GetRfqsParams) {
  return useQuery({
    queryKey: ['seller-incoming-rfqs-list', params],
    queryFn: () => getSellerIncomingRfqs(params),
  });
}

export function useRfq(id: string) {
  return useQuery({
    queryKey: ['rfqs', id],
    queryFn: () => getRfq(id),
    enabled: !!id,
  });
}

export function useCreateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Rfq>) => createRfq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

export function useUpdateRfq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Rfq> }) => updateRfq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
