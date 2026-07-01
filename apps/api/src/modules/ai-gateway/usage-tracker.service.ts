import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

interface TrackUsageParams {
  companyId: string
  userId?: string
  taskType: TaskType
  providerId?: string
  providerName?: string
  modelName?: string
  promptVersion?: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  estimatedCost: number
  cacheHit: boolean
  queueTimeMs: number
  success: boolean
  errorMessage?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name)

  constructor(private readonly prisma: PrismaService) {}

  async track(params: TrackUsageParams): Promise<void> {
    try {
      await this.prisma.aiUsage.create({
        data: {
          companyId: params.companyId,
          userId: params.userId,
          taskType: params.taskType,
          providerId: params.providerId,
          providerName: params.providerName,
          modelName: params.modelName,
          promptVersion: params.promptVersion,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
          latencyMs: params.latencyMs,
          estimatedCost: params.estimatedCost,
          cacheHit: params.cacheHit,
          queueTimeMs: params.queueTimeMs,
          success: params.success,
          errorMessage: params.errorMessage,
          idempotencyKey: params.idempotencyKey,
          metadata: params.metadata ? (params.metadata as any) : undefined,
        },
      })
    } catch (error) {
      this.logger.error(`Failed to track AI usage: ${(error as Error).message}`)
    }
  }

  async getCompanyUsage(companyId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.aiUsage.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiUsage.count({ where: { companyId } }),
    ])
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } }
  }

  async getDailyStats(date?: string) {
    const startDate = date ? new Date(date) : new Date()
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    const result = await this.prisma.aiUsage.aggregate({
      where: { createdAt: { gte: startDate, lt: endDate } },
      _count: { id: true },
      _sum: { totalTokens: true, estimatedCost: true, latencyMs: true },
      _avg: { totalTokens: true, latencyMs: true },
    })
    return {
      date: startDate.toISOString().split('T')[0],
      totalRequests: result._count.id,
      totalTokens: result._sum.totalTokens || 0,
      totalCost: Math.round((result._sum.estimatedCost || 0) * 100) / 100,
      avgLatencyMs: Math.round(result._avg.latencyMs || 0),
      avgTokens: Math.round(result._avg.totalTokens || 0),
    }
  }

  async getTopFeatures(limit = 10) {
    const results = await this.prisma.aiUsage.groupBy({
      by: ['taskType'],
      _count: { id: true },
      _sum: { totalTokens: true, estimatedCost: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    })
    return results.map(r => ({
      taskType: r.taskType,
      totalRequests: r._count.id,
      totalTokens: r._sum.totalTokens || 0,
      totalCost: Math.round((r._sum.estimatedCost || 0) * 100) / 100,
    }))
  }

  async getTopCompanies(limit = 10) {
    const results = await this.prisma.aiUsage.groupBy({
      by: ['companyId'],
      _count: { id: true },
      _sum: { totalTokens: true, estimatedCost: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    })
    return results.map(r => ({
      companyId: r.companyId,
      totalRequests: r._count.id,
      totalTokens: r._sum.totalTokens || 0,
      totalCost: Math.round((r._sum.estimatedCost || 0) * 100) / 100,
    }))
  }

  async getDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [totalUsage, todayUsage, monthUsage, providerBreakdown] = await Promise.all([
      this.prisma.aiUsage.aggregate({ _count: { id: true }, _sum: { totalTokens: true, estimatedCost: true } }),
      this.prisma.aiUsage.aggregate({ where: { createdAt: { gte: today } }, _count: { id: true }, _sum: { estimatedCost: true } }),
      this.prisma.aiUsage.aggregate({ where: { createdAt: { gte: startOfMonth } }, _count: { id: true }, _sum: { estimatedCost: true } }),
      this.prisma.aiUsage.groupBy({ by: ['providerName'], _count: { id: true }, _sum: { totalTokens: true, estimatedCost: true }, orderBy: { _count: { id: 'desc' } } }),
    ])

    return {
      totalRequests: totalUsage._count.id,
      totalTokens: totalUsage._sum.totalTokens || 0,
      totalCost: Math.round((totalUsage._sum.estimatedCost || 0) * 100) / 100,
      todayRequests: todayUsage._count.id,
      todayCost: Math.round((todayUsage._sum.estimatedCost || 0) * 100) / 100,
      monthRequests: monthUsage._count.id,
      monthCost: Math.round((monthUsage._sum.estimatedCost || 0) * 100) / 100,
      providerBreakdown: providerBreakdown.map(p => ({
        provider: p.providerName || 'unknown',
        requests: p._count.id,
        tokens: p._sum.totalTokens || 0,
        cost: Math.round((p._sum.estimatedCost || 0) * 100) / 100,
      })),
    }
  }
}
