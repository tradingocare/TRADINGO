import { useQuery } from '@tanstack/react-query';
import { getCurrentPlan, getPlans, type CurrentSubscription, type Plan } from '@/lib/api/membership';

export function useCurrentPlan() {
  return useQuery({
    queryKey: ['membership', 'current'],
    queryFn: () => getCurrentPlan() as Promise<CurrentSubscription>,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['membership', 'plans'],
    queryFn: () => getPlans() as Promise<Plan[]>,
  });
}
