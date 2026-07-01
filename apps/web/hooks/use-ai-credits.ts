import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiCreditsApi from '@/lib/api/ai-credits';

export function useMyCreditBalance() {
  return useQuery({
    queryKey: ['ai-credits', 'balance'],
    queryFn: aiCreditsApi.getMyCreditBalance,
  });
}

export function useCreditSummary() {
  return useQuery({
    queryKey: ['ai-credits', 'summary'],
    queryFn: aiCreditsApi.getCreditSummary,
  });
}

export function useCompanyCreditDetail(companyId: string) {
  return useQuery({
    queryKey: ['ai-credits', 'company', companyId],
    queryFn: () => aiCreditsApi.getCompanyCreditDetail(companyId),
    enabled: !!companyId,
  });
}

export function useResetCompanyCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => aiCreditsApi.resetCompanyCredits(companyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-credits'] });
    },
  });
}
