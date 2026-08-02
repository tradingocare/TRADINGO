import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { UsageTrackerService } from './usage-tracker.service'
import { CostEngineService } from './cost-engine.service'
import { ProviderHealthService } from './provider-health.service'
import { AiCreditsService } from './ai-credits.service'
import { AiGatewayService } from './ai-gateway.service'
import { ModelRegistryService } from './model-registry.service'
import { AiUsageQueryDto } from './dto/admin-gateway.dto'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { Throttle } from '@nestjs/throttler'

@ApiTags('AI Gateway Admin')
@Controller('admin/ai-gateway')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class AdminAiGatewayController {
  constructor(
    private readonly usageTracker: UsageTrackerService,
    private readonly costEngine: CostEngineService,
    private readonly health: ProviderHealthService,
    private readonly credits: AiCreditsService,
    private readonly gateway: AiGatewayService,
    private readonly modelRegistry: ModelRegistryService,
  ) {}

  @ApiOperation({ summary: 'Get admin AI gateway dashboard' })
  @Get('dashboard')
  async getDashboard() {
    const [usage, healthInfo, features, companies, cost] = await Promise.all([
      this.usageTracker.getDashboardStats(),
      this.health.getProviderHealthDashboard(),
      this.usageTracker.getTopFeatures(),
      this.usageTracker.getTopCompanies(),
      this.costEngine.getPlatformSpend(),
    ])
    return { usage, providers: healthInfo, topFeatures: features, topCompanies: companies, platformSpend: cost }
  }

  @ApiOperation({ summary: 'Get AI usage stats' })
  @Get('usage')
  async getUsage(@Query() query: AiUsageQueryDto) {
    if (query.companyId) return this.usageTracker.getCompanyUsage(query.companyId, query.page, query.limit)
    return this.usageTracker.getDashboardStats()
  }

  @ApiOperation({ summary: 'Get daily AI usage' })
  @Get('usage/daily')
  async getDailyUsage(@Query('date') date?: string) {
    return this.usageTracker.getDailyStats(date)
  }

  @ApiOperation({ summary: 'Get top AI features' })
  @Get('usage/features')
  async getTopFeatures(@Query('limit') limit?: number) {
    return this.usageTracker.getTopFeatures(limit || 10)
  }

  @ApiOperation({ summary: 'Get top AI-using companies' })
  @Get('usage/companies')
  async getTopCompanies(@Query('limit') limit?: number) {
    return this.usageTracker.getTopCompanies(limit || 10)
  }

  @ApiOperation({ summary: 'Get platform AI spend' })
  @Get('cost/platform')
  async getPlatformSpend(@Query('from') from?: string, @Query('to') to?: string) {
    return this.costEngine.getPlatformSpend(from ? new Date(from) : undefined, to ? new Date(to) : undefined)
  }

  @ApiOperation({ summary: 'Get provider health status' })
  @Get('health')
  async getProviderHealth() {
    return this.health.getProviderHealthDashboard()
  }

  @ApiOperation({ summary: 'Check all provider health' })
  @Post('health/check-all')
  async checkAllProviderHealth() {
    return this.health.checkAllProviders()
  }

  @ApiOperation({ summary: 'Get model catalog' })
  @Get('models')
  async getModelCatalog() {
    return { data: this.modelRegistry.getModelCatalog(), stats: this.modelRegistry.getCatalogStats() }
  }

  @ApiOperation({ summary: 'Get best model for task' })
  @Get('models/best')
  async getBestModel(@Query('taskType') taskType: string) {
    return { data: this.modelRegistry.getBestModelForTask(taskType) }
  }

  @ApiOperation({ summary: 'Get credits summary' })
  @Get('credits/summary')
  async getCreditsSummary() {
    return this.credits.getCreditSummary()
  }

  @ApiOperation({ summary: 'Get company credit detail' })
  @Get('credits/company/:companyId')
  async getCompanyCreditDetail(@Param('companyId') companyId: string) {
    return this.credits.getCompanyCreditDetail(companyId)
  }

  @ApiOperation({ summary: 'Reset company credits' })
  @Post('credits/reset/:companyId')
  async resetCompanyCredits(@Param('companyId') companyId: string) {
    await this.credits.resetCompanyUsage(companyId)
    return { message: 'Credits reset for company', companyId }
  }

  @ApiOperation({ summary: 'Get cache statistics' })
  @Get('cache/stats')
  async getCacheStats() {
    const totalUsage = await this.usageTracker.getDashboardStats()
    return {
      enabled: true,
      totalRequests: totalUsage.totalRequests,
      cacheHits: 0,
      cacheMisses: totalUsage.totalRequests,
      hitRate: 0,
      currentEntries: 0,
    }
  }
}
