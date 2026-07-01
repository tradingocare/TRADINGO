import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common'
import { AiAdminService } from './ai-admin.service'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import {
  AiMorningBriefDto, AiRevenueForecastDto, AiUserGrowthPredictionDto,
  AiFraudIntelligenceDto, AiChurnPredictionDto, AiCategoryIntelligenceDto,
  AiGeoIntelligenceDto, AiMarketTrendsDto, AiAlertsDto,
  AiExecutiveCopilotDto, AiWeeklyMonthlyReportDto, AiDecisionSupportDto,
} from './dto/ai-admin.dto'

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string }
}

@Controller('admin/ai')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AiAdminController {
  constructor(private readonly aiAdminService: AiAdminService) {}

  @Post('morning-brief')
  async morningBrief(@Body() dto: AiMorningBriefDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.morningBrief(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('revenue-forecast')
  async revenueForecast(@Body() dto: AiRevenueForecastDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.revenueForecast(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('user-growth-prediction')
  async userGrowthPrediction(@Body() dto: AiUserGrowthPredictionDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.userGrowthPrediction(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('fraud-intelligence')
  async fraudIntelligence(@Body() dto: AiFraudIntelligenceDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.fraudIntelligence(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('churn-prediction')
  async churnPrediction(@Body() dto: AiChurnPredictionDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.churnPrediction(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('category-intelligence')
  async categoryIntelligence(@Body() dto: AiCategoryIntelligenceDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.categoryIntelligence(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('geo-intelligence')
  async geoIntelligence(@Body() dto: AiGeoIntelligenceDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.geoIntelligence(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('market-trends')
  async marketTrends(@Body() dto: AiMarketTrendsDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.marketTrends(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('alerts')
  async aiAlerts(@Body() dto: AiAlertsDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.aiAlerts(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('executive-copilot')
  async executiveCopilot(@Body() dto: AiExecutiveCopilotDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.executiveCopilot(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('report')
  async weeklyMonthlyReport(@Body() dto: AiWeeklyMonthlyReportDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.weeklyMonthlyReport(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }

  @Post('decision-support')
  async decisionSupport(@Body() dto: AiDecisionSupportDto, @Req() req: RequestWithUser) {
    return this.aiAdminService.decisionSupport(req.user?.companyId || req.user?.id || 'admin', req.user?.id || 'admin', dto)
  }
}
