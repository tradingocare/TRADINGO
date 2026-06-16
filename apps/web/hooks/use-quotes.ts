import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuotes,
  getQuote,
  createQuote,
  acceptQuote,
  type GetQuotesParams,
} from '@/lib/api/quotes';
import type { Quote } from '@/lib/api/types';

export function useQuotes(params?: GetQuotesParams) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: () => getQuotes(params),
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => getQuote(id),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quote>) => createQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, rfqId, quoteId, comment }: { companyId: string; rfqId: string; quoteId: string; comment?: string }) =>
      acceptQuote(companyId, rfqId, quoteId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
