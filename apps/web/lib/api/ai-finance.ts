import api from './client'

export interface AiFinanceResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export function aiFinanceCreditRisk(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/credit-risk', data)
}

export function aiFinancePaymentDelay(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/payment-delay', data)
}

export function aiFinanceCashFlowForecast(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/cash-flow-forecast', data)
}

export function aiFinanceCollectionStrategy(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/collection-strategy', data)
}

export function aiFinanceFinancialHealth(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/financial-health', data)
}

export function aiFinanceCreditLimit(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/credit-limit', data)
}

export function aiFinanceInvoiceIntelligence(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/invoice-intelligence', data)
}

export function aiFinanceFraudSignals(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/fraud-signals', data)
}

export function aiFinanceCollectionDraft(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/collection-draft', data)
}

export function aiFinanceSidebar(data: any) {
  return api.post<AiFinanceResponse<any>>('/finance/ai/sidebar', data)
}
