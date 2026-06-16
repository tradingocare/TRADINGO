import { useQuery } from '@tanstack/react-query';
import { getAnalytics, type GetAnalyticsParams } from '@/lib/api/analytics';

export function useAnalytics(params?: GetAnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => getAnalytics(params),
  });
}
