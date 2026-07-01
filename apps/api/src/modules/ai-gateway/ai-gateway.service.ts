import { Injectable, Logger, BadRequestException, ForbiddenException, HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../common/services/redis.service'
import { ProviderRegistryService } from './provider-registry.service'
import { ProviderRouterService } from './provider-router.service'
import { PromptManagerService } from './prompt-manager.service'
import { AiCreditsService } from './ai-credits.service'
import { UsageTrackerService } from './usage-tracker.service'
import { CostEngineService } from './cost-engine.service'
import { ProviderHealthService } from './provider-health.service'
import { BaseAiProvider } from './providers/base-provider'
import { AiGatewayRequestDto } from './dto/gateway.dto'
import { createHash } from 'crypto'

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name)
  private readonly cacheTtlSeconds: number
  private readonly cacheEnabled: boolean

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly registry: ProviderRegistryService,
    private readonly router: ProviderRouterService,
    private readonly prompts: PromptManagerService,
    private readonly credits: AiCreditsService,
    private readonly usageTracker: UsageTrackerService,
    private readonly costEngine: CostEngineService,
    private readonly health: ProviderHealthService,
  ) {
    this.cacheTtlSeconds = configService.get('AI_CACHE_TTL_SECONDS', 3600)
    this.cacheEnabled = configService.get('AI_CACHE_ENABLED', 'true') === 'true'
  }

  async process(dto: AiGatewayRequestDto, companyId: string, userId?: string) {
    const startTime = Date.now()

    this.validateRequest(dto)

    const creditCheck = await this.credits.checkCredits(companyId, dto.taskType)
    if (!creditCheck.sufficient) {
      throw new HttpException({
        statusCode: 402,
        error: 'Payment Required',
        message: `Insufficient AI credits. You have ${creditCheck.available} credits, but this task requires ${creditCheck.required}. Upgrade your plan or wait for next billing cycle.`,
        available: creditCheck.available,
        required: creditCheck.required,
      }, 402)
    }

    const cacheKey = this.buildCacheKey(dto)
    if (this.cacheEnabled) {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (dto.idempotencyKey) {
          const existing = await this.prisma.aiUsage.findUnique({ where: { idempotencyKey: dto.idempotencyKey } })
          if (existing) {
            this.logger.log(`Idempotency hit for key: ${dto.idempotencyKey}`)
            return parsed
          }
        }
        const elapsed = Date.now() - startTime
        await this.usageTracker.track({
          companyId, userId: userId || companyId,
          taskType: dto.taskType,
          providerName: parsed.provider,
          modelName: parsed.model,
          promptTokens: 0, completionTokens: 0, totalTokens: 0,
          latencyMs: elapsed, estimatedCost: 0,
          cacheHit: true, queueTimeMs: 0, success: true,
          idempotencyKey: dto.idempotencyKey,
        })
        return parsed
      }
    }

    const route = await this.router.route(dto.taskType, dto.providerOverride, dto.modelOverride)

    const circuitOpen = await this.health.isCircuitOpen(route.provider.name)
    if (circuitOpen) {
      throw new BadRequestException(`Provider '${route.provider.name}' is currently unavailable (circuit open). Please try again later.`)
    }

    let promptData
    try {
      promptData = await this.prompts.getPrompt(dto.taskType)
    } catch {
      promptData = {
        version: 1,
        systemPrompt: `You are a ${dto.taskType} assistant for TRADINGO B2B marketplace. Respond with valid JSON.`,
        userPrompt: JSON.stringify(dto.payload),
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 2048,
        variables: [],
      }
    }

    const rendered = this.prompts.renderPrompt(promptData, this.flattenPayload(dto.payload))
    const queueStartTime = Date.now()

    const completionStartTime = Date.now()
    let result
    let lastError: Error | null = null
    const providersToTry: { provider: BaseAiProvider; providerConfig: any; model: string }[] = [route]

    for (const attempt of providersToTry) {
      try {
        result = await attempt.provider.complete({
          systemPrompt: rendered.systemPrompt,
          userPrompt: rendered.userPrompt,
          temperature: dto.temperature ?? promptData.temperature,
          maxTokens: dto.maxTokens ?? promptData.maxTokens,
        })
        await this.health.recordSuccess(attempt.provider.name)
        lastError = null
        break
      } catch (error) {
        await this.health.recordFailure(attempt.provider.name)
        lastError = error as Error
        this.logger.warn(`Provider '${attempt.provider.name}' failed for task ${dto.taskType}: ${(error as Error).message}`)
        if (providersToTry.length === 1) {
          const fallbacks = this.router.getFallbackProviders(dto.taskType, attempt.provider.name)
          for (const fb of fallbacks) providersToTry.push(fb)
        }
      }
    }

    if (lastError || !result) {
      const error = lastError || new Error('All providers failed')
      const elapsed = Date.now() - startTime
      await this.usageTracker.track({
        companyId, userId: userId || companyId,
        taskType: dto.taskType,
        providerId: route.providerConfig?.id,
        providerName: route.provider.name,
        modelName: route.model,
        promptVersion: promptData.version,
        promptTokens: 0, completionTokens: 0, totalTokens: 0,
        latencyMs: elapsed, estimatedCost: 0,
        cacheHit: false, queueTimeMs: Date.now() - queueStartTime,
        success: false,
        errorMessage: error.message,
        idempotencyKey: dto.idempotencyKey,
      })
      throw error
    }

    const totalLatency = Date.now() - startTime
    const queueTime = completionStartTime - queueStartTime
    const inputTokens = result.usage?.promptTokens ?? 0
    const outputTokens = result.usage?.completionTokens ?? 0
    const totalTokens = result.usage?.totalTokens ?? 0

    const cost = await this.costEngine.calculateCost(route.provider.name, route.model, inputTokens, outputTokens)

    const response = {
      success: true,
      content: result.content,
      provider: route.provider.name,
      model: result.model || route.model,
      cached: false,
      tokens: { prompt: inputTokens, completion: outputTokens, total: totalTokens },
      latencyMs: totalLatency,
      cost: cost.totalCost,
    }

    if (this.cacheEnabled) {
      await this.redis.set(cacheKey, JSON.stringify(response), this.cacheTtlSeconds)
    }

    await this.credits.deductCredits(companyId, dto.taskType)

    await this.usageTracker.track({
      companyId, userId: userId || companyId,
      taskType: dto.taskType,
      providerId: route.providerConfig?.id,
      providerName: route.provider.name,
      modelName: result.model || route.model,
      promptVersion: promptData.version,
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
      latencyMs: totalLatency,
      estimatedCost: cost.totalCost,
      cacheHit: false,
      queueTimeMs: queueTime,
      success: true,
      idempotencyKey: dto.idempotencyKey,
    })

    return response
  }

  private validateRequest(dto: AiGatewayRequestDto) {
    if (!dto.taskType) throw new BadRequestException('taskType is required')
    if (!dto.payload || Object.keys(dto.payload).length === 0) throw new BadRequestException('payload is required')
  }

  private buildCacheKey(dto: AiGatewayRequestDto): string {
    const hash = createHash('md5').update(JSON.stringify({ taskType: dto.taskType, payload: dto.payload, providerOverride: dto.providerOverride, modelOverride: dto.modelOverride })).digest('hex')
    return `ai:gateway:${dto.taskType}:${hash}`
  }

  private flattenPayload(payload: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(payload)) {
      result[key] = typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return result
  }
}
