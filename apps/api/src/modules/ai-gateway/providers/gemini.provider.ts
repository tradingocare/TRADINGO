import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiCompletionRequest, AiCompletionResponse } from '../../ai/providers/ai-provider.interface'
import { BaseAiProvider, ProviderDefinition, HealthCheckResult, RetryConfig } from './base-provider'
import { TaskType } from '@prisma/client'

@Injectable()
export class GeminiProvider extends BaseAiProvider {
  name = 'gemini'
  protected readonly logger = new Logger(GeminiProvider.name)
  private apiKey = ''
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private defaultModel = 'gemini-2.0-flash'
  private retryConfig: RetryConfig = { maxRetries: 2, baseDelayMs: 2000, maxDelayMs: 10000 }

  constructor(private readonly configService: ConfigService) {
    super()
    this.apiKey = configService.get('GEMINI_API_KEY') || ''
    this.baseUrl = configService.get('GEMINI_BASE_URL') || this.baseUrl
  }

  getDefinition(): ProviderDefinition {
    return {
      name: 'gemini',
      displayName: 'Google AI Studio (Gemini)',
      providerType: 'gemini',
      supportedTasks: [TaskType.OCR, TaskType.QUALITY_SCORING, TaskType.DUPLICATE_DETECTION, TaskType.CRM_ANALYSIS, TaskType.FINANCE_ANALYSIS],
      supportedModels: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-pro'],
      defaultModel: this.defaultModel,
      defaultTimeout: 30000,
      baseUrl: this.baseUrl,
    }
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured, returning mock')
      return { content: `[Gemini Mock] ${req.userPrompt.substring(0, 100)}`, model: this.defaultModel, usage: { promptTokens: this.estimateTokens(req.systemPrompt + req.userPrompt), completionTokens: 100, totalTokens: this.estimateTokens(req.systemPrompt + req.userPrompt) + 100 } }
    }

    const url = `${this.baseUrl}/models/${this.defaultModel}:generateContent?key=${this.apiKey}`
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${req.systemPrompt}\n\n${req.userPrompt}` }] }],
        generationConfig: { temperature: req.temperature ?? 0.7, maxOutputTokens: req.maxTokens ?? 2048 },
      }),
      timeout: 30000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const usage = this.parseTokenCount(data, 'gemini')
    return { content: text, model: this.defaultModel, usage }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const url = `${this.baseUrl}/models?key=${this.apiKey}`
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start, error: 'Health check failed' }
    }
  }

  getApiKey(): string { return this.apiKey }
}
