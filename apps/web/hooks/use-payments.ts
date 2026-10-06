import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPayments,
  getPayment,
  type GetPaymentsParams,
} from '@/lib/api/payments';
import type { Payment } from '@/lib/api/types';

// Batch B repair: `useCreatePayment` (bare POST /payments — no backend route)
// and `useReleaseEscrow` (POST /escrow/:id/release — no HTTP route; release is
// orchestrated internally by the payment/booking flow) had zero page
// consumers and are removed with the dead lib functions that backed them.
export function usePayments(params?: GetPaymentsParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => getPayments(params),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => getPayment(id),
    enabled: !!id,
  });
}

export function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export type { Payment };
