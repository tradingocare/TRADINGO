import { useQuery } from '@tanstack/react-query';
import { getGocashBalance, getGocashHistory, type GetGocashHistoryParams } from '@/lib/api/gocash';

export function useGocashBalance() {
  return useQuery({
    queryKey: ['gocash', 'balance'],
    queryFn: getGocashBalance,
  });
}

export function useGocashHistory(params?: GetGocashHistoryParams) {
  return useQuery({
    queryKey: ['gocash', 'history', params],
    queryFn: () => getGocashHistory(params),
  });
}
