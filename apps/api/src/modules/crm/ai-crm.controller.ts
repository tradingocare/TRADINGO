import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AiCrmService } from './ai-crm.service'
import {
  AiCrmScoringDto,
  AiCrmNextBestActionDto,
  AiCrmConversionProbabilityDto,
  AiCrmLeadInsightsDto,
  AiCrmSentimentDto,
  AiCrmPipelineHealthDto,
  AiCrmForecastDto,
  AiCrmDealRiskDto,
  AiCrmRecommendedActionsDto,
  AiCrmCommunicationTipsDto,
  AiCrmFollowUpPriorityDto,
  AiCrmSidebarDto,
} from './dto/ai-crm.dto'

@ApiTags('AI CRM')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('crm')
export class AiCrmController {
  constructor(private readonly aiCrmService: AiCrmService) {}

  @Post(':id/ai/scoring')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'AI-powered lead scoring (0-100) based on behaviour, profile, trust, engagement' })
  async scoring(@Param('id') id: string, @Body() dto: AiCrmScoringDto, @Req() req: any) {
    return this.aiCrmService.leadScoring(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/next-best-action')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Recommend next best action: call, email, demo, proposal, follow-up, escalation, nurture' })
  async nextBestAction(@Param('id') id: string, @Body() dto: AiCrmNextBestActionDto, @Req() req: any) {
    return this.aiCrmService.nextBestAction(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/conversion-probability')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Predict conversion probability % with key drivers and risk factors' })
  async conversionProbability(@Param('id') id: string, @Body() dto: AiCrmConversionProbabilityDto, @Req() req: any) {
    return this.aiCrmService.conversionProbability(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/insights')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Deep lead insights: engagement patterns, company health, buying intent' })
  async insights(@Param('id') id: string, @Body() dto: AiCrmLeadInsightsDto, @Req() req: any) {
    return this.aiCrmService.leadInsights(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/sentiment')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Analyse sentiment from notes, interactions, timeline events' })
  async sentiment(@Param('id') id: string, @Body() dto: AiCrmSentimentDto, @Req() req: any) {
    return this.aiCrmService.sentiment(id, req.user.id, { ...dto, leadId: id })
  }

  @Post('ai/pipeline-health')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Assess pipeline health: stage distribution, velocity, bottlenecks, leakage' })
  async pipelineHealth(@Body() dto: AiCrmPipelineHealthDto, @Req() req: any) {
    return this.aiCrmService.pipelineHealth(req.user.companyId || req.user.sub, req.user.id, dto)
  }

  @Post('ai/forecast')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Generate sales forecast: expected revenue, close rates, time-to-close' })
  async forecast(@Body() dto: AiCrmForecastDto, @Req() req: any) {
    return this.aiCrmService.forecast(req.user.companyId || req.user.sub, req.user.id, dto)
  }

  @Post(':id/ai/deal-risk')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Detect deal risks: stagnation, ghosting, budget, competitor, timing, blockers' })
  async dealRisk(@Param('id') id: string, @Body() dto: AiCrmDealRiskDto, @Req() req: any) {
    return this.aiCrmService.dealRisk(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/recommended-actions')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Recommended actions per lead status: qualify, demo, proposal, negotiation' })
  async recommendedActions(@Param('id') id: string, @Body() dto: AiCrmRecommendedActionsDto, @Req() req: any) {
    return this.aiCrmService.recommendedActions(id, req.user.id, { ...dto, leadId: id })
  }

  @Post(':id/ai/communication-tips')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Personalized communication tips: messaging, tone, timing, objection handling' })
  async communicationTips(@Param('id') id: string, @Body() dto: AiCrmCommunicationTipsDto, @Req() req: any) {
    return this.aiCrmService.communicationTips(id, req.user.id, { ...dto, leadId: id })
  }

  @Post('ai/follow-up-priority')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'Prioritise follow-ups: urgency score, lead value, time sensitivity' })
  async followUpPriority(@Body() dto: AiCrmFollowUpPriorityDto, @Req() req: any) {
    return this.aiCrmService.followUpPriority(req.user.companyId || req.user.sub, req.user.id, dto)
  }

  @Post(':id/ai/sidebar')
  @Roles('ADMIN', 'SELLER', 'RM')
  @ApiOperation({ summary: 'All-in-one AI sidebar summary for CRM detail page' })
  async sidebar(@Param('id') id: string, @Body() dto: AiCrmSidebarDto, @Req() req: any) {
    return this.aiCrmService.sidebar(id, req.user.id, { ...dto, leadId: id })
  }
}
