import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRfqs, getRfq, createRfq, updateRfq, type GetRfqsParams } from '@/lib/api/rfqs';
import type { Rfq } from '@/lib/api/types';

export function useRfqs(params?: GetRfqsParams) {
  return useQuery({
    queryKey: ['rfqs', params],
    queryFn: () => getRfqs(params),
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
