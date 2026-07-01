import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from '../../ai/providers/ai-provider.interface'
import { BaseAiProvider, ProviderDefinition, HealthCheckResult, RetryConfig } from './base-provider'
import { TaskType } from '@prisma/client'

@Injectable()
export class GroqProvider extends BaseAiProvider {
  name = 'groq'
  protected readonly logger = new Logger(GroqProvider.name)
  private apiKey = ''
  private baseUrl = 'https://api.groq.com/openai/v1'
  private defaultModel = 'llama3-8b-8192'
  private retryConfig: RetryConfig = { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 5000 }

  constructor(private readonly configService: ConfigService) {
    super()
    this.apiKey = configService.get('GROQ_API_KEY') || ''
    this.baseUrl = configService.get('GROQ_BASE_URL') || this.baseUrl
  }

  getDefinition(): ProviderDefinition {
    return {
      name: 'groq',
      displayName: 'Groq',
      providerType: 'groq',
      supportedTasks: [TaskType.FAST_SUGGESTION, TaskType.SPEC_SUGGESTION, TaskType.GENERAL_CHAT],
      supportedModels: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
      defaultModel: this.defaultModel,
      defaultTimeout: 15000,
      baseUrl: this.baseUrl,
    }
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY not configured, returning mock')
      return { content: `[Groq Mock] ${req.userPrompt.substring(0, 100)}`, model: this.defaultModel, usage: { promptTokens: this.estimateTokens(req.systemPrompt + req.userPrompt), completionTokens: 100, totalTokens: this.estimateTokens(req.systemPrompt + req.userPrompt) + 100 } }
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'system', content: req.systemPrompt }, { role: 'user', content: req.userPrompt }],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1024,
      }),
      timeout: 15000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      if (response.status === 429) throw new Error(`Groq rate limited: ${errorBody}`)
      throw new Error(`Groq API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    const usage = this.parseTokenCount(data, 'groq')
    return { content: data.choices?.[0]?.message?.content || '', model: data.model || this.defaultModel, usage }
  }

  async *stream(req: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    if (!this.apiKey) {
      yield { content: `[Groq Mock] ${req.userPrompt.substring(0, 100)}`, done: true }
      return
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'system', content: req.systemPrompt }, { role: 'user', content: req.userPrompt }],
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 1024,
        stream: true,
      }),
      timeout: 30000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Groq stream error ${response.status}: ${errorBody}`)
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
            yield { content, done: false }
          } catch {}
        }
      }
    }
    yield { content: '', done: true }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/models`, { headers: { 'Authorization': `Bearer ${this.apiKey}` }, signal: AbortSignal.timeout(5000) })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start, error: 'Health check failed' }
    }
  }

  getApiKey(): string { return this.apiKey }
}
