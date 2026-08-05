import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { AiCreditsService } from '../ai-gateway/ai-credits.service'
import { AiProductIntelligenceService } from '../ai/ai-product-intelligence.service'
import { CommerceIntelligenceService } from '../ai/commerce-intelligence.service'
import { AiRfqService } from '../smart-rfq/ai-rfq.service'
import { AiQuoteService } from '../quote/ai-quote.service'
import { AiNegotiationService } from '../smart-negotiation/ai-negotiation.service'
import { AiFinanceService } from '../finance/ai-finance.service'
import { AiSearchService } from '../tradfind/ai-search.service'
import { AiAdminService } from '../admin-intelligence/ai-admin.service'
import { AiTradeTalkService } from '../tradetalk/ai-tradetalk.service'
import { FounderAiAggregatorService } from '../founder-ai/founder-ai.service'
import { AiActionRegistry, AiAction } from './ai-action-registry'
import { AiMemoryService } from './ai-memory.service'
import { AiContextEngine } from './ai-context-engine.service'
import { AiObservabilityService } from './ai-observability.service'
import { OrchestrateRequestDto, OrchestrateResponseDto } from './dto/ai-orchestrator.dto'

type ServiceClass = abstract new (...args: any[]) => any

const SERVICE_MAP: Record<string, ServiceClass> = {
  AiProductIntelligenceService,
  CommerceIntelligenceService,
  AiRfqService,
  AiQuoteService,
  AiNegotiationService,
  AiFinanceService,
  AiSearchService,
  AiAdminService,
  AiTradeTalkService,
  FounderAiAggregatorService,
}

type ParamBuilder = (companyId: string, userId: string | undefined, payload: Record<string, unknown>) => any[]

const PARAM_BUILDERS: Record<string, ParamBuilder> = {
  AiProductIntelligenceService: (_c, u, p) => [p, u ?? 'system'],
  CommerceIntelligenceService: (_c, _u, p) => [p.productId || p],
  AiRfqService: (c, u, p) => [p, c, u ?? 'system'],
  AiQuoteService: (c, u, p) => [c, u ?? 'system', p],
  AiNegotiationService: (c, u, p) => [c, u ?? 'system', p],
  AiFinanceService: (c, u, p) => [c, u ?? 'system', p],
  AiSearchService: (c, u, p) => [c, u ?? 'system', p],
  AiAdminService: (c, u, p) => [c, u ?? 'system', p],
  AiTradeTalkService: (c, u, p) => [c, u ?? 'system', p],
  FounderAiAggregatorService: (c, _u, _p) => [c],
}

@Injectable()
export class AiOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AiOrchestratorService.name)
  private resolvedServices = new Map<string, any>()
  private initialized = false

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly registry: AiActionRegistry,
    private readonly memory: AiMemoryService,
    private readonly contextEngine: AiContextEngine,
    private readonly observability: AiObservabilityService,
    private readonly credits: AiCreditsService,
    private readonly gateway: AiGatewayService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.resolveServices()
  }

  private resolveServices() {
    for (const [name, cls] of Object.entries(SERVICE_MAP)) {
      try {
        const instance = this.moduleRef.get(cls, { strict: false })
        if (instance) {
          this.resolvedServices.set(name, instance)
        }
      } catch {
        this.logger.warn(`Service ${name} not resolvable — actions depending on it will be unavailable`)
      }
    }
    this.initialized = true
    this.logger.log(`AiOrchestrator initialized with ${this.resolvedServices.size}/${Object.keys(SERVICE_MAP).length} services`)
  }

  getAvailableActions(): AiAction[] {
    return this.registry.getAll().filter(a => this.resolvedServices.has(a.service))
  }

  isActionAvailable(actionId: string): boolean {
    const action = this.registry.getById(actionId)
    if (!action) return false
    return this.resolvedServices.has(action.service)
  }

  async dispatch(dto: OrchestrateRequestDto): Promise<OrchestrateResponseDto> {
    const startTime = Date.now()
    const { actionId, companyId, userId, payload, useCache = true } = dto

    const action = this.registry.getById(actionId)
    if (!action) throw new NotFoundException(`Action '${actionId}' not found in registry`)

    const serviceInstance = this.resolvedServices.get(action.service)
    if (!serviceInstance) throw new BadRequestException(`Service '${action.service}' is not available — action '${actionId}' cannot be dispatched`)

    const method = serviceInstance[action.method]
    if (typeof method !== 'function') throw new BadRequestException(`Method '${action.method}' not found on service '${action.service}'`)

    this.logger.debug(`Dispatching action '${actionId}' (${action.service}.${action.method})`)

    const cacheKey = useCache ? `orchestrator:${actionId}:${companyId}:${JSON.stringify(payload)}` : null

    if (cacheKey) {
      const cached = this.memory.get(cacheKey)
      if (cached !== undefined) {
        const latency = Date.now() - startTime
        this.observability.record({ actionId, actionName: action.name, companyId, userId, success: true, latencyMs: latency, credits: null, cached: true, fromMemory: true })
        return { success: true, actionId, actionName: action.name, actionDescription: action.description, result: cached, latencyMs: latency, credits: null, cached: true, fromMemory: true, fromCache: false }
      }
    }

    let creditsUsed: { required: number; remaining: number } | null = null
    if (action.credits > 0 && action.taskType) {
      const creditCheck = await this.credits.checkCredits(companyId, action.taskType as any)
      if (!creditCheck.sufficient) {
        const latency = Date.now() - startTime
        this.observability.record({ actionId, actionName: action.name, companyId, userId, success: false, latencyMs: latency, credits: { required: creditCheck.required, remaining: creditCheck.available }, cached: false, fromMemory: false, error: 'Insufficient credits' })
        throw new BadRequestException({
          statusCode: 402,
          error: 'Payment Required',
          message: `Insufficient AI credits. Required: ${action.credits}, Available: ${creditCheck.available}`,
          available: creditCheck.available,
          required: creditCheck.required,
        })
      }
      creditsUsed = { required: creditCheck.required, remaining: creditCheck.available - creditCheck.required }
    }

    try {
      const params = PARAM_BUILDERS[action.service]?.(companyId, userId, payload) ?? [payload]
      const result = await method.apply(serviceInstance, params)

      if (cacheKey && result) {
        this.memory.set(cacheKey, result)
      }

      if (creditsUsed && action.taskType) {
        await this.credits.deductCredits(companyId, action.taskType as any).catch(e => this.logger.warn(`Credit deduction failed: ${e.message}`))
      }

      const latency = Date.now() - startTime
      this.observability.record({ actionId, actionName: action.name, companyId, userId, success: true, latencyMs: latency, credits: creditsUsed, cached: false, fromMemory: false })

      return {
        success: true,
        actionId,
        actionName: action.name,
        actionDescription: action.description,
        result,
        latencyMs: latency,
        credits: creditsUsed,
        cached: false,
        fromMemory: false,
        fromCache: false,
      }
    } catch (err: any) {
      const latency = Date.now() - startTime
      this.observability.record({ actionId, actionName: action.name, companyId, userId, success: false, latencyMs: latency, credits: creditsUsed, cached: false, fromMemory: false, error: err.message })
      throw err
    }
  }

  async dispatchRaw(actionId: string, companyId: string, userId: string | undefined, payload: Record<string, unknown>): Promise<any> {
    const result = await this.dispatch({ actionId, companyId, userId, payload, useCache: false })
    return result.result
  }
}
