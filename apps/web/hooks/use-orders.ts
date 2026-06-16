import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, updateOrderStatus, type GetOrdersParams } from '@/lib/api/orders';

export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => getOrders(params),
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
