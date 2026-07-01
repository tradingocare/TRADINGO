import { useMutation } from '@tanstack/react-query'
import {
  aiFinanceCreditRisk, aiFinancePaymentDelay, aiFinanceCashFlowForecast,
  aiFinanceCollectionStrategy, aiFinanceFinancialHealth, aiFinanceCreditLimit,
  aiFinanceInvoiceIntelligence, aiFinanceFraudSignals, aiFinanceCollectionDraft,
  aiFinanceSidebar,
} from '@/lib/api/ai-finance'

export function useAiFinanceCreditRisk() {
  return useMutation({ mutationFn: (data: any) => aiFinanceCreditRisk(data) })
}

export function useAiFinancePaymentDelay() {
  return useMutation({ mutationFn: (data: any) => aiFinancePaymentDelay(data) })
}

export function useAiFinanceCashFlowForecast() {
  return useMutation({ mutationFn: (data: any) => aiFinanceCashFlowForecast(data) })
}

export function useAiFinanceCollectionStrategy() {
  return useMutation({ mutationFn: (data: any) => aiFinanceCollectionStrategy(data) })
}

export function useAiFinanceFinancialHealth() {
  return useMutation({ mutationFn: (data: any) => aiFinanceFinancialHealth(data) })
}

export function useAiFinanceCreditLimit() {
  return useMutation({ mutationFn: (data: any) => aiFinanceCreditLimit(data) })
}

export function useAiFinanceInvoiceIntelligence() {
  return useMutation({ mutationFn: (data: any) => aiFinanceInvoiceIntelligence(data) })
}

export function useAiFinanceFraudSignals() {
  return useMutation({ mutationFn: (data: any) => aiFinanceFraudSignals(data) })
}

export function useAiFinanceCollectionDraft() {
  return useMutation({ mutationFn: (data: any) => aiFinanceCollectionDraft(data) })
}

export function useAiFinanceSidebar() {
  return useMutation({ mutationFn: (data: any) => aiFinanceSidebar(data) })
}
