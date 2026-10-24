import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, updateOrderStatus, type GetOrdersParams } from '@/lib/api/orders';

// Batch B repair: these hooks previously resolved to bare `/orders` (404).
// The canonical backend family is smart-order (`/smart-order/buyer|seller|admin/all`).
// The role selects the canonical endpoint; buyers remain the default for the
// existing no-arg call sites.
export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => getOrders({ ...params, role: params?.role ?? 'buyer' }),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
