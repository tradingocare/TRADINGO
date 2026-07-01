import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

interface CostCalculation {
  totalCost: number
  inputCost: number
  outputCost: number
  currency: string
}

interface ProviderCostConfig {
  costPer1kInput: number
  costPer1kOutput: number
}

const DEFAULT_COSTS: Record<string, ProviderCostConfig> = {
  'openai/gpt-4o': { costPer1kInput: 0.01, costPer1kOutput: 0.03 },
  'openai/gpt-4o-mini': { costPer1kInput: 0.0015, costPer1kOutput: 0.006 },
  'anthropic/claude-3.5-sonnet': { costPer1kInput: 0.03, costPer1kOutput: 0.15 },
  'google/gemini-2.0-flash': { costPer1kInput: 0.0001, costPer1kOutput: 0.0004 },
  'gemini-2.0-flash': { costPer1kInput: 0.0001, costPer1kOutput: 0.0004 },
  'gemini-2.0-pro': { costPer1kInput: 0.001, costPer1kOutput: 0.002 },
  'llama3-70b-8192': { costPer1kInput: 0.00059, costPer1kOutput: 0.00079 },
  'llama3-8b-8192': { costPer1kInput: 0.00005, costPer1kOutput: 0.00008 },
  'mixtral-8x7b-32768': { costPer1kInput: 0.00024, costPer1kOutput: 0.00024 },
  'gemma2-9b-it': { costPer1kInput: 0.00006, costPer1kOutput: 0.00006 },
  'tavily-search': { costPer1kInput: 0, costPer1kOutput: 0.01 },
  'firecrawl-scrape': { costPer1kInput: 0, costPer1kOutput: 0.003 },
  'firecrawl-crawl': { costPer1kInput: 0, costPer1kOutput: 0.01 },
}

@Injectable()
export class CostEngineService {
  private readonly logger = new Logger(CostEngineService.name)

  constructor(private readonly prisma: PrismaService) {}

  async calculateCost(providerName: string, model: string, inputTokens: number, outputTokens: number): Promise<CostCalculation> {
    const config = await this.getProviderCostConfig(providerName, model)
    const inputCost = (inputTokens / 1000) * config.costPer1kInput
    const outputCost = (outputTokens / 1000) * config.costPer1kOutput
    return {
      inputCost: Math.round(inputCost * 100000) / 100000,
      outputCost: Math.round(outputCost * 100000) / 100000,
      totalCost: Math.round((inputCost + outputCost) * 100000) / 100000,
      currency: 'USD',
    }
  }

  private async getProviderCostConfig(providerName: string, model: string): Promise<ProviderCostConfig> {
    if (DEFAULT_COSTS[model]) return DEFAULT_COSTS[model]
    if (DEFAULT_COSTS[providerName]) return DEFAULT_COSTS[providerName]
    try {
      const provider = await this.prisma.aiProvider.findUnique({ where: { name: providerName } })
      if (provider) return { costPer1kInput: provider.costPer1kInput, costPer1kOutput: provider.costPer1kOutput }
    } catch {}
    return { costPer1kInput: 0.001, costPer1kOutput: 0.002 }
  }

  async getCompanySpend(companyId: string, fromDate?: Date, toDate?: Date) {
    const where: any = { companyId }
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = fromDate
      if (toDate) where.createdAt.lte = toDate
    }
    const result = await this.prisma.aiUsage.aggregate({
      where,
      _sum: { estimatedCost: true },
      _count: { id: true },
    })
    return {
      companyId,
      totalSpend: Math.round((result._sum.estimatedCost || 0) * 100) / 100,
      totalRequests: result._count.id,
    }
  }

  async getPlatformSpend(fromDate?: Date, toDate?: Date) {
    const where: any = {}
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = fromDate
      if (toDate) where.createdAt.lte = toDate
    }
    const result = await this.prisma.aiUsage.aggregate({
      where,
      _sum: { estimatedCost: true },
      _count: { id: true },
    })
    return {
      totalSpend: Math.round((result._sum.estimatedCost || 0) * 100) / 100,
      totalRequests: result._count.id,
    }
  }
}
