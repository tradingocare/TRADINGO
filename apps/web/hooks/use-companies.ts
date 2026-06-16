import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanies, getCompany, updateCompany, type GetCompaniesParams } from '@/lib/api/companies';
import type { Company } from '@/lib/api/types';

export function useCompanies(params?: GetCompaniesParams) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => getCompanies(params),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => getCompany(id),
    enabled: !!id,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
