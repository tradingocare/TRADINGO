import { useMutation, useQuery } from '@tanstack/react-query'
import {
  generateRfqFromText, refineRfq, detectMissingFields, detectDuplicateRfqs,
  predictCategory, suggestProducts, suggestSuppliers, calculateQualityScore,
  translateRfq, getAiAssistantData,
} from '@/lib/api/ai-rfq'

export function useGenerateRfqFromText() {
  return useMutation({ mutationFn: ({ text, language }: { text: string; language?: string }) => generateRfqFromText(text, language) })
}

export function useRefineRfq() {
  return useMutation({ mutationFn: ({ rfqId, focusArea, additionalContext }: { rfqId: string; focusArea?: string; additionalContext?: string }) => refineRfq(rfqId, focusArea, additionalContext) })
}

export function useDetectMissingFields() {
  return useMutation({ mutationFn: ({ rfqData, language }: { rfqData: Record<string, unknown>; language?: string }) => detectMissingFields(rfqData, language) })
}

export function useDetectDuplicateRfqs() {
  return useMutation({ mutationFn: ({ title, description, productNames }: { title: string; description?: string; productNames?: string[] }) => detectDuplicateRfqs(title, description, productNames) })
}

export function usePredictCategory() {
  return useMutation({ mutationFn: ({ productName, description }: { productName: string; description?: string }) => predictCategory(productName, description) })
}

export function useSuggestProducts() {
  return useMutation({ mutationFn: ({ productNames, categoryId, limit }: { productNames: string[]; categoryId?: string; limit?: number }) => suggestProducts(productNames, categoryId, limit) })
}

export function useSuggestSuppliers() {
  return useMutation({ mutationFn: ({ rfqId, limit }: { rfqId: string; limit?: number }) => suggestSuppliers(rfqId, limit) })
}

export function useQualityScore() {
  return useMutation({ mutationFn: ({ rfqData }: { rfqData: Record<string, unknown> }) => calculateQualityScore(rfqData) })
}

export function useTranslateRfq() {
  return useMutation({ mutationFn: ({ rfqId, targetLanguage }: { rfqId: string; targetLanguage: string }) => translateRfq(rfqId, targetLanguage) })
}

export function useAiAssistant() {
  return useMutation({ mutationFn: ({ rfqData, context }: { rfqData: Record<string, unknown>; context?: string }) => getAiAssistantData(rfqData, context) })
}
