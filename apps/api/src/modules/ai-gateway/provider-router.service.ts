import { Injectable, Logger } from '@nestjs/common'
import { ProviderRegistryService } from './provider-registry.service'
import { BaseAiProvider } from './providers/base-provider'
import { TaskType } from '@prisma/client'

interface RouteResult {
  provider: BaseAiProvider
  providerConfig: any
  model: string
}

@Injectable()
export class ProviderRouterService {
  private readonly logger = new Logger(ProviderRouterService.name)
  private readonly defaultRouting: Partial<Record<TaskType, string>> = {
    [TaskType.PRODUCT_DESCRIPTION]: 'openrouter',
    [TaskType.SEO_GENERATION]: 'openrouter',
    [TaskType.TRANSLATION]: 'openrouter',
    [TaskType.SPEC_SUGGESTION]: 'groq',
    [TaskType.IMAGE_SUGGESTION]: 'openrouter',
    [TaskType.QUALITY_SCORING]: 'gemini',
    [TaskType.DUPLICATE_DETECTION]: 'gemini',
    [TaskType.OCR]: 'gemini',
    [TaskType.FAST_SUGGESTION]: 'groq',
    [TaskType.LIVE_SEARCH]: 'tavily',
    [TaskType.WEBSITE_IMPORT]: 'firecrawl',
    [TaskType.RFQ_ANALYSIS]: 'openrouter',
    [TaskType.QUOTE_ANALYSIS]: 'openrouter',
    [TaskType.NEGOTIATION]: 'openrouter',
    [TaskType.CRM_ANALYSIS]: 'openrouter',
    [TaskType.FINANCE_ANALYSIS]: 'openrouter',
    [TaskType.SEARCH_ANALYSIS]: 'openrouter',
    [TaskType.ADMIN_INTELLIGENCE]: 'openrouter',
    [TaskType.GENERAL_CHAT]: 'groq',
  }

  constructor(private readonly registry: ProviderRegistryService) {}

  async route(taskType: TaskType, providerOverride?: string, modelOverride?: string): Promise<RouteResult> {
    let providerName = providerOverride

    if (!providerName) {
      providerName = this.defaultRouting[taskType]
    }

    if (providerName) {
      const instance = this.registry.getProviderInstance(providerName)
      const config = await this.registry.getProvider(providerName).catch(() => null)
      if (instance && config?.enabled !== false) {
        return {
          provider: instance,
          providerConfig: config || instance.getDefinition(),
          model: modelOverride || instance.getDefinition().defaultModel,
        }
      }
    }

    const bestConfig = await this.registry.getBestProviderForTask(taskType)
    const bestInstance = this.registry.getProviderInstance(bestConfig.name)
    if (!bestInstance) throw new Error(`No registered instance for provider: ${bestConfig.name}`)

    return {
      provider: bestInstance,
      providerConfig: bestConfig,
      model: modelOverride || (bestConfig.supportedModels as string[])?.[0] || bestInstance.getDefinition().defaultModel,
    }
  }

  getFallbackProviders(taskType: TaskType, failedProviderName: string): RouteResult[] {
    const fallbacks: RouteResult[] = []
    const primary = this.defaultRouting[taskType]

    const allProviderNames = Array.from(new Set([
      ...Object.values(this.defaultRouting),
      'openrouter', 'gemini', 'groq', 'tavily', 'firecrawl',
    ]))

    for (const name of allProviderNames) {
      if (name === failedProviderName || name === primary) continue
      const instance = this.registry.getProviderInstance(name)
      if (!instance) continue
      const definition = instance.getDefinition()
      if (!definition.supportedTasks.includes(taskType)) continue
      fallbacks.push({
        provider: instance,
        providerConfig: definition,
        model: definition.defaultModel,
      })
    }

    return fallbacks
  }
}
