import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPayments,
  createPayment,
  releaseEscrow,
  type GetPaymentsParams,
} from '@/lib/api/payments';
import type { Payment } from '@/lib/api/types';

export function usePayments(params?: GetPaymentsParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => getPayments(params),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Payment>) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useReleaseEscrow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (escrowId: string) => releaseEscrow(escrowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
