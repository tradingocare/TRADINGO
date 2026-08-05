import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import * as Sentry from '@sentry/nestjs'
import { QueueNames, AiJobData, AiJobTypes } from './queues'
import { AiGatewayService } from '../modules/ai-gateway/ai-gateway.service'
import { AiOrchestratorService } from '../modules/ai-orchestrator/ai-orchestrator.service'
import { AiWorkflowEngine } from '../modules/ai-orchestrator/ai-workflow-engine.service'
import { AiCircuitBreakerService } from '../modules/ai-runtime/ai-circuit-breaker.service'
import { AiSlaEngineService } from '../modules/ai-runtime/ai-sla-engine.service'
import { AiTelemetryService } from '../modules/ai-runtime/ai-telemetry.service'
import { AiAgentRuntimeService } from '../modules/ai-runtime/ai-agent-runtime.service'
import { AiGatewayRequestDto } from '../modules/ai-gateway/dto/gateway.dto'
import { TaskType } from '@prisma/client'

@Processor(QueueNames.AI, { concurrency: 5, lockDuration: 60000 })
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name)

  constructor(
    private readonly gateway: AiGatewayService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly workflowEngine: AiWorkflowEngine,
    private readonly circuitBreaker: AiCircuitBreakerService,
    private readonly slaEngine: AiSlaEngineService,
    private readonly telemetry: AiTelemetryService,
    private readonly runtime: AiAgentRuntimeService,
  ) {
    super()
  }

  async process(job: Job<AiJobData>): Promise<any> {
    const { companyId, userId, options } = job.data
    const taskId = options?.taskId
    const startTime = Date.now()

    this.logger.log(`Processing AI job ${job.id} type=${job.data.type} taskId=${taskId || 'none'}`)

    if (taskId) {
      this.runtime.updateTaskStatus(taskId, 'RUNNING' as any)
    }

    await job.updateProgress(10)

    try {
      const result = await this.executeJob(job)

      const latency = Date.now() - startTime
      await job.updateProgress(100)

      if (taskId) {
        this.runtime.updateTaskStatus(taskId, 'COMPLETED' as any, { progress: 100, completedAt: new Date().toISOString(), result })
      }

      const actionId = options?.actionId || job.data.type
      this.slaEngine.recordLatency(actionId, latency, companyId, userId)

      return result
    } catch (error) {
      const latency = Date.now() - startTime
      const errMsg = (error as Error).message

      this.telemetry.recordError(errMsg)

      if (taskId) {
        this.runtime.updateTaskStatus(taskId, 'FAILED' as any, { error: errMsg, completedAt: new Date().toISOString() })
      }

      this.logger.error(`AI job ${job.id} failed after ${latency}ms: ${errMsg}`)
      throw error
    }
  }

  private async executeJob(job: Job<AiJobData>): Promise<any> {
    const { type } = job.data

    switch (type) {
      case AiJobTypes.PROCESS_WORKFLOW:
        return this.executeWorkflow(job)

      case AiJobTypes.PROCESS_PARALLEL:
        return this.executeParallel(job)

      case AiJobTypes.PROCESS_BULK:
        return this.executeBulk(job)

      case AiJobTypes.GENERATE_DESCRIPTION:
      case AiJobTypes.GENERATE_SEO:
      case AiJobTypes.TRANSLATE:
      case AiJobTypes.SUGGEST_SPECS:
      case AiJobTypes.SUGGEST_IMAGES:
      case AiJobTypes.QUALITY_SCORE:
      case AiJobTypes.DUPLICATE_DETECT:
        return this.executeSingleTask(job)

      default:
        this.logger.warn(`Unknown AI job type: ${type}`)
        return { success: false, error: `Unknown job type: ${type}` }
    }
  }

  private async executeSingleTask(job: Job<AiJobData>): Promise<any> {
    const { type, companyId, userId, options } = job.data
    const gatewayTaskType = options?.gatewayTaskType || this.mapToTaskType(type)
    const actionId = options?.actionId

    const circuitKey = `action:${actionId || type}`
    const circuitOpen = await this.circuitBreaker.isOpen(circuitKey, actionId)
    if (circuitOpen) {
      throw new Error(`Circuit breaker open for '${actionId || type}'`)
    }

    await job.updateProgress(30)

    const dto: AiGatewayRequestDto = {
      taskType: gatewayTaskType as TaskType,
      payload: (options?.payload || {}) as Record<string, unknown>,
      providerOverride: undefined,
      modelOverride: undefined,
      temperature: undefined,
      maxTokens: undefined,
    }

    try {
      await job.updateProgress(60)
      const result = await this.gateway.process(dto, companyId, userId)
      await this.circuitBreaker.onSuccess(circuitKey)
      await job.updateProgress(90)
      return result
    } catch (error) {
      await this.circuitBreaker.onFailure(circuitKey, actionId)
      throw error
    }
  }

  private async executeBulk(job: Job<AiJobData>): Promise<any> {
    const { companyId, userId, productIds, options } = job.data
    const actionId = options?.actionId

    if (!productIds || productIds.length === 0) {
      if (actionId) {
        return this.orchestrator.dispatchRaw(actionId, companyId, userId, options?.payload as any || {})
      }
      return { success: false, error: 'No productIds and no actionId provided' }
    }

    const results = []
    for (let i = 0; i < productIds.length; i++) {
      const progress = Math.round(((i + 1) / productIds.length) * 80) + 10
      await job.updateProgress(progress)

      try {
        if (actionId) {
          const result = await this.orchestrator.dispatchRaw(actionId, companyId, userId, { productId: productIds[i], ...options?.payload as any })
          results.push({ productId: productIds[i], success: true, result })
        }
      } catch (error) {
        results.push({ productId: productIds[i], success: false, error: (error as Error).message })
      }
    }

    await job.updateProgress(100)
    return { success: true, total: productIds.length, results }
  }

  private async executeWorkflow(job: Job<AiJobData>): Promise<any> {
    const { companyId, userId, options } = job.data

    if (!options?.workflowId) {
      throw new Error('workflowId is required for PROCESS_WORKFLOW')
    }

    await job.updateProgress(20)
    const result = await this.workflowEngine.execute({
      workflowId: options.workflowId,
      companyId,
      userId,
      context: (options.payload || {}) as Record<string, unknown>,
    })

    await job.updateProgress(100)
    return result
  }

  private async executeParallel(job: Job<AiJobData>): Promise<any> {
    const { companyId, userId, options } = job.data
    const payload = (options?.payload || {}) as Record<string, unknown>
    const actions = payload.actions as Array<{ actionId: string; payload: Record<string, unknown> }> | undefined

    if (!actions || actions.length === 0) {
      throw new Error('actions array is required for PROCESS_PARALLEL')
    }

    await job.updateProgress(20)
    const results = await Promise.allSettled(
      actions.map(a =>
        this.orchestrator.dispatchRaw(a.actionId, companyId, userId, a.payload)
      ),
    )

    await job.updateProgress(100)
    return {
      success: results.every(r => r.status === 'fulfilled'),
      total: actions.length,
      results: results.map((r, i) => ({
        actionId: actions[i].actionId,
        success: r.status === 'fulfilled',
        result: r.status === 'fulfilled' ? r.value : undefined,
        error: r.status === 'rejected' ? (r.reason as Error).message : undefined,
      })),
    }
  }

  private mapToTaskType(type: AiJobTypes): string {
    const map: Record<string, string> = {
      [AiJobTypes.GENERATE_DESCRIPTION]: 'PRODUCT_ENRICHMENT',
      [AiJobTypes.GENERATE_SEO]: 'SEO_OPTIMIZATION',
      [AiJobTypes.TRANSLATE]: 'TRANSLATION',
      [AiJobTypes.SUGGEST_SPECS]: 'SPEC_EXTRACTION',
      [AiJobTypes.SUGGEST_IMAGES]: 'IMAGE_ANALYSIS',
      [AiJobTypes.QUALITY_SCORE]: 'QUALITY_SCORING',
      [AiJobTypes.DUPLICATE_DETECT]: 'DUPLICATE_DETECTION',
    }
    return map[type] || 'PRODUCT_ENRICHMENT'
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<AiJobData>): void {
    this.logger.log(`AI job ${job.id} completed (type: ${job.data.type})`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AiJobData>, error: Error): void {
    this.logger.error(`AI job ${job.id} failed: ${error.message}`)
    Sentry.captureException(error, { tags: { queue: 'ai', jobId: String(job.id), type: String(job.data.type) }, extra: { data: job.data } })
  }

  @OnWorkerEvent('active')
  onActive(job: Job<AiJobData>): void {
    const taskId = job.data.options?.taskId
    if (taskId) {
      try { this.runtime.updateTaskStatus(taskId, 'RUNNING' as any, { startedAt: new Date().toISOString() }) } catch { }
    }
  }
}
