import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartQuoteApi } from '@/lib/api/smart-quote';

export function useQuoteList(companyId: string, rfqId: string) {
  return useQuery({ queryKey: ['smart-quotes', companyId, rfqId], queryFn: () => smartQuoteApi.list(companyId, rfqId), enabled: !!companyId && !!rfqId });
}

export function useQuoteDetail(companyId: string, rfqId: string, quoteId: string) {
  return useQuery({ queryKey: ['smart-quotes', 'detail', quoteId], queryFn: () => smartQuoteApi.getById(companyId, rfqId, quoteId), enabled: !!companyId && !!rfqId && !!quoteId });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, data }: { companyId: string; rfqId: string; data: any }) => smartQuoteApi.create(companyId, rfqId, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}

export function useSubmitQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, quoteId }: { companyId: string; rfqId: string; quoteId: string }) => smartQuoteApi.submit(companyId, rfqId, quoteId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}

export function useAcceptQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, quoteId }: { companyId: string; rfqId: string; quoteId: string }) => smartQuoteApi.accept(companyId, rfqId, quoteId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}

export function useRejectQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, quoteId, reason }: { companyId: string; rfqId: string; quoteId: string; reason?: string }) => smartQuoteApi.reject(companyId, rfqId, quoteId, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}

export function useWithdrawQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, quoteId, reason }: { companyId: string; rfqId: string; quoteId: string; reason?: string }) => smartQuoteApi.withdraw(companyId, rfqId, quoteId, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}

export function useReviseQuote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ companyId, rfqId, quoteId, data }: { companyId: string; rfqId: string; quoteId: string; data: any }) => smartQuoteApi.revise(companyId, rfqId, quoteId, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['smart-quotes'] }); } });
}
