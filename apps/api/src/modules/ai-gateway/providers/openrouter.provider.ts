import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from '../../ai/providers/ai-provider.interface'
import { BaseAiProvider, ProviderDefinition, HealthCheckResult, RetryConfig } from './base-provider'
import { TaskType } from '@prisma/client'

@Injectable()
export class OpenRouterProvider extends BaseAiProvider {
  name = 'openrouter'
  protected readonly logger = new Logger(OpenRouterProvider.name)
  private apiKey = ''
  private baseUrl = 'https://openrouter.ai/api/v1'
  private defaultModel = 'openai/gpt-4o-mini'
  private retryConfig: RetryConfig = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000 }

  constructor(private readonly configService: ConfigService) {
    super()
    this.apiKey = configService.get('OPENROUTER_API_KEY') || ''
    this.baseUrl = configService.get('OPENROUTER_BASE_URL') || this.baseUrl
  }

  getDefinition(): ProviderDefinition {
    return {
      name: 'openrouter',
      displayName: 'OpenRouter',
      providerType: 'openrouter',
      supportedTasks: [
        TaskType.PRODUCT_DESCRIPTION, TaskType.SEO_GENERATION, TaskType.TRANSLATION,
        TaskType.SPEC_SUGGESTION, TaskType.IMAGE_SUGGESTION, TaskType.QUALITY_SCORING,
        TaskType.RFQ_ANALYSIS, TaskType.QUOTE_ANALYSIS, TaskType.NEGOTIATION,
        TaskType.CRM_ANALYSIS, TaskType.FINANCE_ANALYSIS, TaskType.SEARCH_ANALYSIS, TaskType.ADMIN_INTELLIGENCE, TaskType.GENERAL_CHAT,
      ],
      supportedModels: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
      defaultModel: this.defaultModel,
      defaultTimeout: 30000,
      baseUrl: this.baseUrl,
    }
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY not configured, returning mock')
      return { content: `[OpenRouter Mock] ${req.userPrompt.substring(0, 100)}`, model: this.defaultModel, usage: { promptTokens: this.estimateTokens(req.systemPrompt + req.userPrompt), completionTokens: 100, totalTokens: this.estimateTokens(req.systemPrompt + req.userPrompt) + 100 } }
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'HTTP-Referer': 'https://tradingo.io', 'X-Title': 'Tradingo AI' },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'system', content: req.systemPrompt }, { role: 'user', content: req.userPrompt }],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 2048,
      }),
      timeout: 30000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      if (response.status === 429) throw new Error(`OpenRouter rate limited: ${errorBody}`)
      if (response.status >= 500) throw new Error(`OpenRouter server error ${response.status}: ${errorBody}`)
      throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    const usage = this.parseTokenCount(data, 'openrouter')
    return { content: data.choices?.[0]?.message?.content || '', model: data.model || this.defaultModel, usage }
  }

  async *stream(req: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    if (!this.apiKey) {
      yield { content: `[OpenRouter Mock] ${req.userPrompt.substring(0, 100)}`, done: true }
      return
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'HTTP-Referer': 'https://tradingo.io', 'X-Title': 'Tradingo AI' },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'system', content: req.systemPrompt }, { role: 'user', content: req.userPrompt }],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 2048,
        stream: true,
      }),
      timeout: 60000,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenRouter stream error ${response.status}: ${errorBody}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body for streaming')

    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') { yield { content: '', done: true }; return }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            yield { content, done: false, model: parsed.model }
          } catch {}
        }
      }
    }
    yield { content: '', done: true }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/models`, { signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start, error: 'Health check failed' }
    }
  }

  getApiKey(): string { return this.apiKey }
}
