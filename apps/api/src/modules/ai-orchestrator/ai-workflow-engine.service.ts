import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AiOrchestratorService } from './ai-orchestrator.service'
import {
  WorkflowDefinition, WorkflowStep, WorkflowExecuteDto,
  WorkflowExecuteResponseDto, WorkflowStepResult,
} from './dto/ai-orchestrator.dto'

const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'product-launch-optimization',
    name: 'Product Launch Optimization',
    description: 'Optimize a product for launch: generate description, SEO, specs, images, pricing, and quality scoring',
    tags: ['product', 'launch', 'optimization'],
    steps: [
      { actionId: 'product.generate-description', inputMapping: { 'productId': 'productId' }, outputMapping: { 'descriptionResult': 'result' } },
      { actionId: 'product.generate-seo', inputMapping: { 'productId': 'productId' }, outputMapping: { 'seoResult': 'result' } },
      { actionId: 'product.suggest-specs', inputMapping: { 'productId': 'productId' }, outputMapping: { 'specsResult': 'result' } },
      { actionId: 'product.suggest-images', inputMapping: { 'productId': 'productId' }, outputMapping: { 'imagesResult': 'result' } },
      { actionId: 'commerce.suggested-price', inputMapping: { 'productId': 'productId' }, outputMapping: { 'pricingResult': 'result' } },
      { actionId: 'product.generate-title', inputMapping: { 'productId': 'productId' }, outputMapping: { 'titleResult': 'result' } },
      { actionId: 'product.generate-highlights', inputMapping: { 'productId': 'productId' }, outputMapping: { 'highlightsResult': 'result' } },
    ],
  },
  {
    id: 'seller-growth-review',
    name: 'Seller Growth Review',
    description: 'Analyze seller performance: commerce insights, sales potential, competition, advertising suggestions, and quality scores',
    tags: ['seller', 'growth', 'analytics'],
    steps: [
      { actionId: 'commerce.sales-potential', inputMapping: { 'productId': 'productId' }, outputMapping: { 'salesPotential': 'result' } },
      { actionId: 'commerce.demand-trend', inputMapping: { 'productId': 'productId' }, outputMapping: { 'demandTrend': 'result' } },
      { actionId: 'commerce.competition', inputMapping: { 'productId': 'productId' }, outputMapping: { 'competition': 'result' } },
      { actionId: 'commerce.advertising-suggestion', inputMapping: { 'productId': 'productId' }, outputMapping: { 'adSuggestion': 'result' } },
      { actionId: 'commerce.full-insights', inputMapping: { 'productId': 'productId' }, outputMapping: { 'fullInsights': 'result' } },
    ],
  },
  {
    id: 'marketplace-health-review',
    name: 'Marketplace Health Review',
    description: 'Weekly marketplace health analysis: morning brief, revenue forecast, growth prediction, fraud intelligence, and churn prediction',
    tags: ['marketplace', 'health', 'admin'],
    steps: [
      { actionId: 'admin.morning-brief', inputMapping: {}, outputMapping: { 'brief': 'result' } },
      { actionId: 'admin.revenue-forecast', inputMapping: {}, outputMapping: { 'revenueForecast': 'result' } },
      { actionId: 'admin.user-growth', inputMapping: {}, outputMapping: { 'growthPrediction': 'result' } },
      { actionId: 'admin.fraud-intelligence', inputMapping: {}, outputMapping: { 'fraudIntel': 'result' } },
      { actionId: 'admin.churn-prediction', inputMapping: {}, outputMapping: { 'churnPrediction': 'result' } },
    ],
  },
  {
    id: 'founder-executive-brief',
    name: 'Founder Executive Brief',
    description: 'Comprehensive executive brief: market intelligence, revenue forecast, risk assessment, health score, and priorities',
    tags: ['founder', 'executive', 'brief'],
    steps: [
      { actionId: 'founder.morning-brief', inputMapping: {}, outputMapping: { 'brief': 'result' } },
      { actionId: 'founder.executive-dashboard', inputMapping: {}, outputMapping: { 'dashboard': 'result' } },
      { actionId: 'founder.risk-intelligence', inputMapping: {}, outputMapping: { 'riskIntel': 'result' } },
      { actionId: 'founder.growth-intelligence', inputMapping: {}, outputMapping: { 'growthIntel': 'result' } },
      { actionId: 'founder.health-score', inputMapping: {}, outputMapping: { 'healthScore': 'result' } },
      { actionId: 'founder.priorities', inputMapping: {}, outputMapping: { 'priorities': 'result' } },
    ],
  },
]

@Injectable()
export class AiWorkflowEngine {
  private readonly logger = new Logger(AiWorkflowEngine.name)
  private workflowMap = new Map<string, WorkflowDefinition>()

  constructor(private readonly orchestrator: AiOrchestratorService) {
    for (const wf of WORKFLOWS) {
      this.workflowMap.set(wf.id, wf)
    }
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflowMap.values())
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflowMap.get(id)
  }

  async execute(dto: WorkflowExecuteDto): Promise<WorkflowExecuteResponseDto> {
    const workflow = this.workflowMap.get(dto.workflowId)
    if (!workflow) throw new NotFoundException(`Workflow '${dto.workflowId}' not found`)

    this.logger.log(`Executing workflow '${workflow.id}' (${workflow.steps.length} steps) for company ${dto.companyId}`)

    const startTime = Date.now()
    const workflowContext = { ...dto.context }
    const results: WorkflowStepResult[] = []
    let allSuccess = true

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]
      const stepStartTime = Date.now()

      try {
        if (step.condition) {
          const conditionMet = this.evaluateCondition(step.condition, workflowContext)
          if (!conditionMet) {
            this.logger.debug(`Step ${i + 1}: condition '${step.condition}' not met — skipping`)
            results.push({ step: i + 1, actionId: step.actionId, success: true, result: { skipped: true, reason: `Condition '${step.condition}' not met` }, latencyMs: 0 })
            continue
          }
        }

        const stepPayload = this.buildStepPayload(step, workflowContext, dto)
        const dispatchResult = await this.orchestrator.dispatch({
          actionId: step.actionId,
          companyId: dto.companyId,
          userId: dto.userId,
          payload: stepPayload,
          useCache: false,
        })

        if (step.outputMapping) {
          for (const [ctxKey, resultKey] of Object.entries(step.outputMapping)) {
            const keys = resultKey.split('.')
            let value: any = dispatchResult as any
            for (const k of keys) value = value?.[k]
            if (value !== undefined) {
              workflowContext[ctxKey] = value
            }
          }
        }

        results.push({
          step: i + 1,
          actionId: step.actionId,
          success: dispatchResult.success,
          result: dispatchResult.result,
          latencyMs: dispatchResult.latencyMs,
        })

        if (!dispatchResult.success) {
          allSuccess = false
          break
        }
      } catch (err: any) {
        allSuccess = false
        const stepLatency = Date.now() - stepStartTime
        results.push({ step: i + 1, actionId: step.actionId, success: false, result: null, latencyMs: stepLatency, error: err.message })
        break
      }
    }

    const totalLatency = Date.now() - startTime
    return {
      success: allSuccess,
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepsCompleted: results.filter(r => r.success).length,
      totalSteps: workflow.steps.length,
      results,
      totalLatencyMs: totalLatency,
      finalContext: workflowContext,
    }
  }

  private buildStepPayload(step: WorkflowStep, context: Record<string, unknown>, _dto: WorkflowExecuteDto): Record<string, unknown> {
    const payload: Record<string, unknown> = {}
    if (step.inputMapping) {
      for (const [payloadKey, ctxKey] of Object.entries(step.inputMapping)) {
        if (ctxKey in context) {
          payload[payloadKey] = context[ctxKey]
        }
      }
    }
    return payload
  }

  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
      const match = condition.match(/^context\.(\w+)\s*(===|!==|>|<|>=|<=)\s*(.+)$/)
      if (!match) return true
      const [, key, op, rawVal] = match
      const ctxVal = context[key]
      let cmpVal: any = rawVal.trim()
      if (cmpVal === 'true') cmpVal = true
      else if (cmpVal === 'false') cmpVal = false
      else if (!isNaN(Number(cmpVal))) cmpVal = Number(cmpVal)
      else if (cmpVal.startsWith("'") && cmpVal.endsWith("'")) cmpVal = cmpVal.slice(1, -1)
      switch (op) {
        case '===': return ctxVal === cmpVal
        case '!==': return ctxVal !== cmpVal
        case '>': return Number(ctxVal) > Number(cmpVal)
        case '<': return Number(ctxVal) < Number(cmpVal)
        case '>=': return Number(ctxVal) >= Number(cmpVal)
        case '<=': return Number(ctxVal) <= Number(cmpVal)
        default: return true
      }
    } catch {
      return true
    }
  }
}
