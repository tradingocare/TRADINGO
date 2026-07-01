import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiCompletionRequest, AiCompletionResponse } from '../../ai/providers/ai-provider.interface'
import { BaseAiProvider, ProviderDefinition, HealthCheckResult, RetryConfig } from './base-provider'
import { TaskType } from '@prisma/client'

@Injectable()
export class FirecrawlProvider extends BaseAiProvider {
  name = 'firecrawl'
  protected readonly logger = new Logger(FirecrawlProvider.name)
  private apiKey = ''
  private baseUrl = 'https://api.firecrawl.dev/v1'
  private retryConfig: RetryConfig = { maxRetries: 2, baseDelayMs: 2000, maxDelayMs: 15000 }

  constructor(private readonly configService: ConfigService) {
    super()
    this.apiKey = configService.get('FIRECRAWL_API_KEY') || ''
    this.baseUrl = configService.get('FIRECRAWL_BASE_URL') || this.baseUrl
  }

  getDefinition(): ProviderDefinition {
    return {
      name: 'firecrawl',
      displayName: 'Firecrawl',
      providerType: 'firecrawl',
      supportedTasks: [TaskType.WEBSITE_IMPORT],
      supportedModels: ['firecrawl-scrape', 'firecrawl-crawl'],
      defaultModel: 'firecrawl-scrape',
      defaultTimeout: 60000,
      baseUrl: this.baseUrl,
    }
  }

  async complete(req: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!this.apiKey) {
      this.logger.warn('FIRECRAWL_API_KEY not configured, returning mock')
      return { content: `[Firecrawl Mock] Scraped content for: ${req.userPrompt.substring(0, 100)}`, model: 'firecrawl-scrape', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    }

    const url = req.userPrompt.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { content: 'Invalid URL. Please provide a valid HTTP or HTTPS URL.', model: 'firecrawl-scrape', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ url, formats: ['markdown', 'rawHtml'] }),
      timeout: 60000,
    }, this.retryConfig)

    if (!response.ok) {
      const errorBody = await response.text()
      if (response.status === 429) throw new Error('Firecrawl rate limited. Please try again later.')
      throw new Error(`Firecrawl API error ${response.status}: ${errorBody}`)
    }

    const data = await response.json()
    const content = data?.data?.markdown || data?.data?.rawHtml || data?.data?.content || JSON.stringify(data)
    return {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      model: 'firecrawl-scrape',
      usage: { promptTokens: 0, completionTokens: this.estimateTokens(typeof content === 'string' ? content : JSON.stringify(content)), totalTokens: this.estimateTokens(typeof content === 'string' ? content : JSON.stringify(content)) },
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] }),
        signal: AbortSignal.timeout(15000),
      })
      return { healthy: response.ok, latencyMs: Date.now() - start }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start, error: 'Health check failed' }
    }
  }

  getApiKey(): string { return this.apiKey }
}
