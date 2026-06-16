import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKycSubmissions, reviewKyc, type GetKycSubmissionsParams } from '@/lib/api/kyc';

export function useKycSubmissions(params?: GetKycSubmissionsParams) {
  return useQuery({
    queryKey: ['kyc', params],
    queryFn: () => getKycSubmissions(params),
  });
}

export function useReviewKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      reviewKyc(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
  });
}
