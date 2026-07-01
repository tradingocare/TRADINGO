import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiApi from '@/lib/api/ai';

export function useGenerateDescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.generateDescription,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-cache', vars.productId] }),
  });
}

export function useGenerateSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.generateSeo,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-cache', vars.productId] }),
  });
}

export function useTranslateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.translateProduct,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-cache', vars.productId] }),
  });
}

export function useSuggestSpecs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.suggestSpecs,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-cache', vars.productId] }),
  });
}

export function useSuggestImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.suggestImages,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['ai-cache', vars.productId] }),
  });
}

export function useUpdateSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Parameters<typeof aiApi.updateSeo>[1] }) => aiApi.updateSeo(productId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scores'] }); },
  });
}

export function useAiCache(productId: string, cacheType?: string) {
  return useQuery({
    queryKey: ['ai-cache', productId, cacheType],
    queryFn: () => aiApi.getAiCache(productId, cacheType),
    enabled: !!productId,
  });
}

export function useAcceptSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.acceptSuggestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-cache'] }); qc.invalidateQueries({ queryKey: ['scores'] }); },
  });
}

export function useCalculateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.calculateScore,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scores'] }); },
  });
}

export function useScores(params?: Parameters<typeof aiApi.listScores>[0]) {
  return useQuery({
    queryKey: ['scores', 'list', params],
    queryFn: () => aiApi.listScores(params),
  });
}

export function useScore(productId: string) {
  return useQuery({
    queryKey: ['scores', productId],
    queryFn: () => aiApi.getScore(productId),
    enabled: !!productId,
  });
}

export function useQualityDashboard(params?: { companyId?: string }) {
  return useQuery({
    queryKey: ['quality-dashboard', params],
    queryFn: () => aiApi.getQualityDashboard(params),
  });
}

export function useDetectDuplicates() {
  return useMutation({ mutationFn: aiApi.detectDuplicates });
}

export function useBulkEnhance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.bulkEnhance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bulk-jobs'] }); },
  });
}

export function useBulkJobs(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['bulk-jobs', params],
    queryFn: () => aiApi.listBulkJobs(params),
  });
}

export function useBulkStats() {
  return useQuery({
    queryKey: ['bulk-stats'],
    queryFn: aiApi.getBulkStats,
    refetchInterval: 10000,
  });
}
