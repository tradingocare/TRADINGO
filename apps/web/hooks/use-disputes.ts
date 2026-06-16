import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDisputes, getDispute, resolveDispute, type GetDisputesParams } from '@/lib/api/disputes';
import type { Dispute } from '@/lib/api/types';

export function useDisputes(params?: GetDisputesParams) {
  return useQuery({
    queryKey: ['disputes', params],
    queryFn: () => getDisputes(params),
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: ['disputes', id],
    queryFn: () => getDispute(id),
    enabled: !!id,
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Dispute> }) => resolveDispute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}
