import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiCompletionRequest, AiCompletionResponse } from '../../ai/providers/ai-provider.interface'
import { BaseAiProvider, ProviderDefinition, HealthCheckResult, RetryConfig } from './base-provider'
import { TaskType } from '@prisma/client'

@Injectable()
export class TavilyProvider extends BaseAiProvider {
  name = 'tavily'
  protected readonly logger = new Logger(TavilyProvider.name)
  private apiKey = ''
  private baseUrl = 'https://api.tavily.com'
  private retryConfig: RetryConfig = { maxRetries: 2, baseDelayMs: 1000, maxDelayMs: 5000 }

  constructor(private readonly configService: ConfigService) {
    super()
    this.apiKey = configService.get('TAVILY_API_KEY') || ''
    this.baseUrl = configService.get('TAVILY_BASE_URL') || this.baseUrl
  }

  getDefinition(): ProviderDefinition {
    return {
      name: 'tavily',
      displayName: 'Tavily',
      providerType: 'tavily',
      supportedTasks: [TaskType.LIVE_SEARCH],
      supportedModels: ['tavily-search'],
      defaultModel: 'tavily-search',
      defaultTimeout: 15000,
      baseUrl: this.baseUrl,
    }
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('TAVILY_API_KEY not configured, returning mock')
      return { content: `[Tavily Mock] Search results for: ${req.userPrompt.substring(0, 100)}`, model: 'tavily-search', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: req.userPrompt,
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: true,
        max_results: 10,
      }),
      timeout: 15000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Tavily API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    let content = data.answer || ''
    if (data.results?.length) {
      content += '\n\nSources:\n' + data.results.slice(0, 5).map((r: any) => `- [${r.title}](${r.url})`).join('\n')
      content += '\n\nRaw Content:\n' + data.results.map((r: any) => r.raw_content || r.content || '').join('\n\n')
    }

    return {
      content,
      model: 'tavily-search',
      usage: { promptTokens: this.estimateTokens(req.userPrompt), completionTokens: content.length, totalTokens: this.estimateTokens(req.userPrompt) + content.length },
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.apiKey, query: 'health', max_results: 1 }),
        signal: AbortSignal.timeout(10000),
      })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start, error: 'Health check failed' }
    }
  }

  getApiKey(): string { return this.apiKey }
}
