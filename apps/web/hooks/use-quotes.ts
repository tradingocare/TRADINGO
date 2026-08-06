import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuotes,
  getQuote,
  createQuote,
  acceptQuote,
  submitQuote,
  withdrawQuote,
  reviseQuote,
  updateQuote,
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

export function useSubmitQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, rfqId, quoteId }: { companyId: string; rfqId: string; quoteId: string }) =>
      submitQuote(companyId, rfqId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useWithdrawQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, rfqId, quoteId, reason }: { companyId: string; rfqId: string; quoteId: string; reason?: string }) =>
      withdrawQuote(companyId, rfqId, quoteId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useReviseQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, rfqId, quoteId, data }: { companyId: string; rfqId: string; quoteId: string; data: Record<string, unknown> }) =>
      reviseQuote(companyId, rfqId, quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, rfqId, quoteId, data }: { companyId: string; rfqId: string; quoteId: string; data: Record<string, unknown> }) =>
      updateQuote(companyId, rfqId, quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
