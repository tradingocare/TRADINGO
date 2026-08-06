import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { FounderAiAggregatorService } from './founder-ai.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { DecisionCenterDto, FounderCopilotDto } from './dto/founder-ai.dto'

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string }
}

@ApiTags('Founder AI')
@Controller('admin/founder-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class FounderAiController {
  constructor(private readonly founderAiService: FounderAiAggregatorService) {}

  @ApiOperation({ summary: 'Get morning brief' })
  @Get('morning-brief')
  async morningBrief(@Req() req: RequestWithUser) {
    return this.founderAiService.morningBrief(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get evening summary' })
  @Get('evening-summary')
  async eveningSummary(@Req() req: RequestWithUser) {
    return this.founderAiService.eveningSummary(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get executive dashboard' })
  @Get('executive-dashboard')
  async executiveDashboard(@Req() req: RequestWithUser) {
    return this.founderAiService.executiveDashboard(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get decision center' })
  @Post('decision-center')
  async decisionCenter(@Body() dto: DecisionCenterDto, @Req() req: RequestWithUser) {
    return this.founderAiService.decisionCenter(dto, req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get risk intelligence' })
  @Get('risk-intelligence')
  async riskIntelligence(@Req() req: RequestWithUser) {
    return this.founderAiService.riskIntelligence(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get growth intelligence' })
  @Get('growth-intelligence')
  async growthIntelligence(@Req() req: RequestWithUser) {
    return this.founderAiService.growthIntelligence(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get founder copilot' })
  @Post('copilot')
  async founderCopilot(@Body() dto: FounderCopilotDto, @Req() req: RequestWithUser) {
    return this.founderAiService.founderCopilot(dto, req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get business health score' })
  @Get('health-score')
  async healthScore(@Req() req: RequestWithUser) {
    return this.founderAiService.healthScore(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get executive priorities' })
  @Get('priorities')
  async executivePriorities(@Req() req: RequestWithUser) {
    return this.founderAiService.executivePriorities(req.user?.companyId || req.user?.id)
  }

  @ApiOperation({ summary: 'Get executive timeline' })
  @Get('timeline')
  async executiveTimeline() {
    return this.founderAiService.executiveTimeline()
  }

  @ApiOperation({ summary: 'Get executive report by type' })
  @Get('report/:type')
  async executiveReport(@Param('type') type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
    return this.founderAiService.executiveReport(type)
  }

  @ApiOperation({ summary: 'Get marketplace intelligence' })
  @Get('marketplace-intelligence')
  async marketplaceIntelligence() {
    return this.founderAiService.marketplaceIntelligence()
  }

  @ApiOperation({ summary: 'Get TradeServ intelligence' })
  @Get('tradeserv-intelligence')
  async tradeservIntelligence() {
    return this.founderAiService.tradeservIntelligence()
  }

  @ApiOperation({ summary: 'Get TradeTalk intelligence' })
  @Get('tradetalk-intelligence')
  async tradetalkIntelligence() {
    return this.founderAiService.tradetalkIntelligence()
  }

  @ApiOperation({ summary: 'Get membership intelligence' })
  @Get('membership-intelligence')
  async membershipIntelligence() {
    return this.founderAiService.membershipIntelligence()
  }

  @ApiOperation({ summary: 'Get GOCASH intelligence' })
  @Get('gocash-intelligence')
  async gocashIntelligence() {
    return this.founderAiService.gocashIntelligence()
  }

  @ApiOperation({ summary: 'Get TradTrust intelligence' })
  @Get('tradtrust-intelligence')
  async tradtrustIntelligence() {
    return this.founderAiService.tradtrustIntelligence()
  }

  @ApiOperation({ summary: 'Get advertising intelligence' })
  @Get('advertising-intelligence')
  async advertisingIntelligence() {
    return this.founderAiService.advertisingIntelligence()
  }

  @ApiOperation({ summary: 'Get security intelligence' })
  @Get('security-intelligence')
  async securityIntelligence() {
    return this.founderAiService.securityIntelligence()
  }
}
