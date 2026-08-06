import { useQuery } from '@tanstack/react-query';
import { getIndustries, getIndustry } from '@/lib/api/industries';

export function useIndustries(params?: { search?: string }) {
  return useQuery({
    queryKey: ['industries', params],
    queryFn: () => getIndustries(params),
    staleTime: 60_000,
  });
}

export function useIndustry(slug: string) {
  return useQuery({
    queryKey: ['industry', slug],
    queryFn: () => getIndustry(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
