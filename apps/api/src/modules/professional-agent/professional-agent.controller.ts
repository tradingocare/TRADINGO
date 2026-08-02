import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { ProfessionalAgentService } from './professional-agent.service';

@ApiTags('Professional Agent')
@Controller('professional-agent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SELLER', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class ProfessionalAgentController {
  constructor(private readonly agent: ProfessionalAgentService) {}

  @ApiOperation({ summary: 'Get professional dashboard copilot' })
  @Get('dashboard-copilot')
  getDashboardCopilot(@Req() req: any) {
    return this.agent.getDashboardCopilot(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get client acquisition insights' })
  @Get('client-acquisition')
  getClientAcquisition(@Req() req: any) {
    return this.agent.getClientAcquisition(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get proposal intelligence' })
  @Get('proposal-intelligence')
  getProposalIntelligence(@Req() req: any) {
    return this.agent.getProposalIntelligence(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get portfolio intelligence' })
  @Get('portfolio-intelligence')
  getPortfolioIntelligence(@Req() req: any) {
    return this.agent.getPortfolioIntelligence(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get reputation advisor' })
  @Get('reputation-advisor')
  getReputationAdvisor(@Req() req: any) {
    return this.agent.getReputationAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get revenue planner' })
  @Get('revenue-planner')
  getRevenuePlanner(@Req() req: any) {
    return this.agent.getRevenuePlanner(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get professional notifications' })
  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.agent.getNotifications(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get TradeTalk integration' })
  @Get('tradetalk-integration')
  getTradeTalkIntegration(@Req() req: any) {
    return this.agent.getTradeTalkIntegration(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get all professional insights' })
  @Get('insights')
  getAllInsights(@Req() req: any) {
    return this.agent.getAllInsights(req.user.companyId);
  }
}
