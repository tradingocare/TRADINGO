import { Logger } from '@nestjs/common'
import { AiProvider, AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from '../../ai/providers/ai-provider.interface'
import { TaskType } from '@prisma/client'

export interface ProviderDefinition {
  name: string
  displayName: string
  providerType: string
  supportedTasks: TaskType[]
  supportedModels: string[]
  defaultModel: string
  defaultTimeout: number
  baseUrl?: string
}

export interface HealthCheckResult {
  healthy: boolean
  latencyMs: number
  error?: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

export abstract class BaseAiProvider implements AiProvider {
  abstract name: string
  protected abstract readonly logger: Logger

  abstract complete(req: AiCompletionRequest): Promise<AiCompletionResponse>

  stream?(req: AiCompletionRequest): AsyncGenerator<AiStreamChunk>

  abstract getDefinition(): ProviderDefinition

  abstract healthCheck(): Promise<HealthCheckResult>

  abstract getApiKey(): string

  protected async fetchWithRetry(url: string, options: RequestInit & { timeout?: number }, retryConfig?: RetryConfig): Promise<Response> {
    const config = retryConfig || { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000 }
    const timeoutMs = options.timeout || 30000
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        const response = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error
        if (attempt < config.maxRetries) {
          const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs)
          this.logger.warn(`Retry ${attempt + 1}/${config.maxRetries} for ${url} after ${delay}ms: ${(error as Error).message}`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    throw lastError || new Error('Request failed after retries')
  }

  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  protected parseTokenCount(response: any, provider: string): { promptTokens: number; completionTokens: number; totalTokens: number } {
    try {
      if (provider === 'openrouter' && response?.usage) {
        return { promptTokens: response.usage.prompt_tokens || 0, completionTokens: response.usage.completion_tokens || 0, totalTokens: response.usage.total_tokens || 0 }
      }
      if (provider === 'gemini' && response?.usageMetadata) {
        return { promptTokens: response.usageMetadata.promptTokenCount || 0, completionTokens: response.usageMetadata.candidatesTokenCount || 0, totalTokens: response.usageMetadata.totalTokenCount || 0 }
      }
      if (provider === 'groq' && response?.usage) {
        return { promptTokens: response.usage.prompt_tokens || 0, completionTokens: response.usage.completion_tokens || 0, totalTokens: response.usage.total_tokens || 0 }
      }
    } catch {}
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  }
}
