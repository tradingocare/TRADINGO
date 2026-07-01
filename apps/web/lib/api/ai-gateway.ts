import api from './client'

export interface AiProviderConfig {
  id: string
  name: string
  displayName: string
  providerType: string
  enabled: boolean
  priority: number
  baseUrl: string | null
  supportedModels: string[]
  supportedTasks: string[]
  timeoutMs: number
  retryCount: number
  rateLimitRpm: number
  healthStatus: string
  lastHealthCheckAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  failureCount: number
  circuitOpen: boolean
  circuitOpenUntil: string | null
  costPer1kInput: number
  costPer1kOutput: number
  createdAt: string
  updatedAt: string
}

export interface AiPromptTemplate {
  id: string
  taskType: string
  version: number
  name: string
  description: string | null
  systemPrompt: string
  userPrompt: string | null
  variables: string[]
  temperature: number
  maxTokens: number
  providerOverride: string | null
  modelOverride: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AiProviderHealth {
  name: string
  displayName: string
  providerType: string
  enabled: boolean
  priority: number
  healthStatus: string
  lastHealthCheckAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  failureCount: number
  circuitOpen: boolean
  timeoutMs: number
  rateLimitRpm: number
}

export interface AiDashboardData {
  usage: {
    totalRequests: number
    totalTokens: number
    totalCost: number
    todayRequests: number
    todayCost: number
    monthRequests: number
    monthCost: number
    providerBreakdown: Array<{ provider: string; requests: number; tokens: number; cost: number }>
  }
  providers: AiProviderHealth[]
  topFeatures: Array<{ taskType: string; totalRequests: number; totalTokens: number; totalCost: number }>
  topCompanies: Array<{ companyId: string; totalRequests: number; totalTokens: number; totalCost: number }>
  platformSpend: { totalSpend: number; totalRequests: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }
}

// --- Providers ---

export function listProviders(page = 1, limit = 20) {
  return api.get<PaginatedResponse<AiProviderConfig>>('/ai-gateway/providers', { params: { page, limit } })
}

export function getProvider(name: string) {
  return api.get<AiProviderConfig>(`/ai-gateway/providers/${name}`)
}

export function createProvider(data: Partial<AiProviderConfig>) {
  return api.post<AiProviderConfig>('/ai-gateway/providers', data)
}

export function updateProvider(name: string, data: Partial<AiProviderConfig>) {
  return api.patch<AiProviderConfig>(`/ai-gateway/providers/${name}`, data)
}

export function setApiKey(providerName: string, apiKey: string) {
  return api.post('/ai-gateway/providers/api-key', { providerName, apiKey })
}

export function checkProviderHealth(name: string) {
  return api.post(`/ai-gateway/providers/${name}/health`)
}

export function checkAllProvidersHealth() {
  return api.post('/ai-gateway/providers/health/all')
}

// --- Prompts ---

export function listPrompts(page = 1, limit = 20, taskType?: string) {
  return api.get<PaginatedResponse<AiPromptTemplate>>('/ai-gateway/prompts', { params: { page, limit, taskType } })
}

export function createPrompt(data: Partial<AiPromptTemplate>) {
  return api.post<AiPromptTemplate>('/ai-gateway/prompts', data)
}

export function updatePrompt(id: string, data: Partial<AiPromptTemplate>) {
  return api.patch<AiPromptTemplate>(`/ai-gateway/prompts/${id}`, data)
}

export function activatePrompt(id: string) {
  return api.post(`/ai-gateway/prompts/${id}/activate`)
}

export function getPromptVersions(taskType: string) {
  return api.get(`/ai-gateway/prompts/versions/${taskType}`)
}

export function getActivePrompt(taskType: string) {
  return api.get<AiPromptTemplate>(`/ai-gateway/prompts/${taskType}/active`)
}

// --- Admin Dashboard ---

export function getAiInfrastructureDashboard() {
  return api.get<AiDashboardData>('/admin/ai-gateway/dashboard')
}

export function getAiUsage(params?: Record<string, unknown>) {
  return api.get('/admin/ai-gateway/usage', { params })
}

export function getDailyAiUsage(date?: string) {
  return api.get('/admin/ai-gateway/usage/daily', { params: { date } })
}

export function getTopAiFeatures(limit = 10) {
  return api.get('/admin/ai-gateway/usage/features', { params: { limit } })
}

export function getTopAiCompanies(limit = 10) {
  return api.get('/admin/ai-gateway/usage/companies', { params: { limit } })
}

export function getPlatformAiSpend(from?: string, to?: string) {
  return api.get('/admin/ai-gateway/cost/platform', { params: { from, to } })
}

export function getProviderHealth() {
  return api.get<AiProviderHealth[]>('/admin/ai-gateway/health')
}

// --- Model Registry ---

export interface ModelCapability {
  name: string
  provider: string
  displayName: string
  vision: boolean
  ocr: boolean
  streaming: boolean
  maxTokens: number
  contextWindow: number
  costPer1kInput: number
  costPer1kOutput: number
  category: string
}

export function getModelCatalog() {
  return api.get<{ data: ModelCapability[]; stats: { totalModels: number; providers: number; byCategory: Record<string, number>; byCapability: Record<string, number> } }>('/admin/ai-gateway/models')
}

export function getBestModel(taskType: string) {
  return api.get<{ data: ModelCapability | null }>('/admin/ai-gateway/models/best', { params: { taskType } })
}

// --- Cache Stats ---

export interface CacheStats {
  enabled: boolean
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  currentEntries: number
}

export function getAiCacheStats() {
  return api.get<CacheStats>('/admin/ai-gateway/cache/stats')
}

// --- Streaming ---

export function processStream(dto: Record<string, unknown>) {
  return api.post<{ content: string; model: string }>('/ai-gateway/stream', dto)
}
