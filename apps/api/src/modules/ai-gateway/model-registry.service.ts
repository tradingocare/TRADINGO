import { Injectable, Logger } from '@nestjs/common'
import { ProviderRegistryService } from './provider-registry.service'

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
  category: 'chat' | 'search' | 'scrape' | 'crawl'
}

const MODEL_CATALOG: Omit<ModelCapability, 'provider' | 'displayName'>[] = [
  { name: 'openai/gpt-4o', vision: true, ocr: true, streaming: true, maxTokens: 4096, contextWindow: 128000, costPer1kInput: 0.01, costPer1kOutput: 0.03, category: 'chat' },
  { name: 'openai/gpt-4o-mini', vision: true, ocr: true, streaming: true, maxTokens: 4096, contextWindow: 128000, costPer1kInput: 0.0015, costPer1kOutput: 0.006, category: 'chat' },
  { name: 'anthropic/claude-3.5-sonnet', vision: true, ocr: false, streaming: true, maxTokens: 4096, contextWindow: 200000, costPer1kInput: 0.03, costPer1kOutput: 0.15, category: 'chat' },
  { name: 'google/gemini-2.0-flash', vision: true, ocr: true, streaming: true, maxTokens: 8192, contextWindow: 1048576, costPer1kInput: 0.0001, costPer1kOutput: 0.0004, category: 'chat' },
  { name: 'gemini-2.0-flash', vision: true, ocr: true, streaming: true, maxTokens: 8192, contextWindow: 1048576, costPer1kInput: 0.0001, costPer1kOutput: 0.0004, category: 'chat' },
  { name: 'gemini-2.0-pro', vision: true, ocr: true, streaming: true, maxTokens: 8192, contextWindow: 1048576, costPer1kInput: 0.001, costPer1kOutput: 0.002, category: 'chat' },
  { name: 'gemini-1.5-pro', vision: true, ocr: true, streaming: true, maxTokens: 8192, contextWindow: 1048576, costPer1kInput: 0.00125, costPer1kOutput: 0.005, category: 'chat' },
  { name: 'llama3-70b-8192', vision: false, ocr: false, streaming: true, maxTokens: 8192, contextWindow: 8192, costPer1kInput: 0.00059, costPer1kOutput: 0.00079, category: 'chat' },
  { name: 'llama3-8b-8192', vision: false, ocr: false, streaming: true, maxTokens: 8192, contextWindow: 8192, costPer1kInput: 0.00005, costPer1kOutput: 0.00008, category: 'chat' },
  { name: 'mixtral-8x7b-32768', vision: false, ocr: false, streaming: true, maxTokens: 32768, contextWindow: 32768, costPer1kInput: 0.00024, costPer1kOutput: 0.00024, category: 'chat' },
  { name: 'gemma2-9b-it', vision: false, ocr: false, streaming: true, maxTokens: 8192, contextWindow: 8192, costPer1kInput: 0.00006, costPer1kOutput: 0.00006, category: 'chat' },
  { name: 'tavily-search', vision: false, ocr: false, streaming: false, maxTokens: 0, contextWindow: 0, costPer1kInput: 0, costPer1kOutput: 0.01, category: 'search' },
  { name: 'firecrawl-scrape', vision: false, ocr: false, streaming: false, maxTokens: 0, contextWindow: 0, costPer1kInput: 0, costPer1kOutput: 0.003, category: 'scrape' },
  { name: 'firecrawl-crawl', vision: false, ocr: false, streaming: false, maxTokens: 0, contextWindow: 0, costPer1kInput: 0, costPer1kOutput: 0.01, category: 'crawl' },
]

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openrouter: 'OpenRouter',
  gemini: 'Google AI Studio (Gemini)',
  groq: 'Groq',
  tavily: 'Tavily',
  firecrawl: 'Firecrawl',
}

@Injectable()
export class ModelRegistryService {
  private readonly logger = new Logger(ModelRegistryService.name)

  constructor(private readonly registry: ProviderRegistryService) {}

  getModelCatalog(): ModelCapability[] {
    const models: ModelCapability[] = []
    const instances = this.registry.getAllInstances()
    const seen = new Set<string>()

    for (const instance of instances) {
      const def = instance.getDefinition()
      const providerName = def.name
      const displayName = PROVIDER_DISPLAY_NAMES[providerName] || def.displayName

      for (const modelName of def.supportedModels) {
        if (seen.has(modelName)) continue
        seen.add(modelName)

        const catalog = MODEL_CATALOG.find(m => m.name === modelName)
        if (catalog) {
          models.push({ ...catalog, provider: providerName, displayName })
        } else {
          models.push({
            name: modelName,
            provider: providerName,
            displayName,
            vision: false,
            ocr: false,
            streaming: true,
            maxTokens: 2048,
            contextWindow: 4096,
            costPer1kInput: 0,
            costPer1kOutput: 0,
            category: 'chat',
          })
        }
      }
    }

    return models
  }

  getModelsByProvider(providerName: string): ModelCapability[] {
    return this.getModelCatalog().filter(m => m.provider === providerName)
  }

  getModelsByCapability(capability: keyof ModelCapability, value: boolean): ModelCapability[] {
    return this.getModelCatalog().filter(m => typeof m[capability] === 'boolean' && m[capability] === value)
  }

  getBestModelForTask(taskType: string): ModelCapability | null {
    const models = this.getModelCatalog()
    const taskModelMap: Record<string, string[]> = {
      PRODUCT_DESCRIPTION: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'google/gemini-2.0-flash'],
      SEO_GENERATION: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      TRANSLATION: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      SPEC_SUGGESTION: ['llama3-70b-8192', 'gemma2-9b-it'],
      IMAGE_SUGGESTION: ['openai/gpt-4o-mini'],
      QUALITY_SCORING: ['gemini-2.0-flash', 'google/gemini-2.0-flash'],
      DUPLICATE_DETECTION: ['gemini-2.0-flash'],
      OCR: ['gemini-2.0-flash', 'openai/gpt-4o-mini'],
      FAST_SUGGESTION: ['llama3-8b-8192', 'gemma2-9b-it'],
      LIVE_SEARCH: ['tavily-search'],
      WEBSITE_IMPORT: ['firecrawl-scrape'],
      RFQ_ANALYSIS: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      QUOTE_ANALYSIS: ['openai/gpt-4o-mini'],
      NEGOTIATION: ['openai/gpt-4o-mini'],
      CRM_ANALYSIS: ['openai/gpt-4o-mini'],
      FINANCE_ANALYSIS: ['openai/gpt-4o-mini'],
      SEARCH_ANALYSIS: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      ADMIN_INTELLIGENCE: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
      GENERAL_CHAT: ['llama3-8b-8192', 'gemma2-9b-it'],
    }

    const preferredModels = taskModelMap[taskType]
    if (!preferredModels) return models.find(m => m.category === 'chat') || null

    for (const name of preferredModels) {
      const found = models.find(m => m.name === name)
      if (found) return found
    }
    return models.find(m => m.category === 'chat') || null
  }

  getCatalogStats(): { totalModels: number; providers: number; byCategory: Record<string, number>; byCapability: Record<string, number> } {
    const models = this.getModelCatalog()
    const byCategory: Record<string, number> = {}
    const byCapability: Record<string, number> = {}

    for (const m of models) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1
      if (m.vision) byCapability['vision'] = (byCapability['vision'] || 0) + 1
      if (m.ocr) byCapability['ocr'] = (byCapability['ocr'] || 0) + 1
      if (m.streaming) byCapability['streaming'] = (byCapability['streaming'] || 0) + 1
    }

    const providers = new Set(models.map(m => m.provider))
    return { totalModels: models.length, providers: providers.size, byCategory, byCapability }
  }
}
