import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { CommunityAgentService } from './community-agent.service';

@ApiTags('Community Agent')
@Controller('community-agent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SELLER', 'BUYER', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class CommunityAgentController {
  constructor(private readonly agent: CommunityAgentService) {}

  @ApiOperation({ summary: 'Get community dashboard copilot' })
  @Get('dashboard-copilot')
  getDashboardCopilot(@Req() req: any) {
    return this.agent.getDashboardCopilot(req.user.companyId, req.user.id);
  }

  @ApiOperation({ summary: 'Get networking advisor' })
  @Get('networking-advisor')
  getNetworkingAdvisor(@Req() req: any) {
    return this.agent.getNetworkingAdvisor(req.user.companyId, req.user.id);
  }

  @ApiOperation({ summary: 'Get community intelligence' })
  @Get('community-intelligence')
  getCommunityIntelligence(@Req() req: any) {
    return this.agent.getCommunityIntelligence(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get knowledge discovery' })
  @Get('knowledge-discovery')
  getKnowledgeDiscovery(@Req() req: any) {
    return this.agent.getKnowledgeDiscovery(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get collaboration advisor' })
  @Get('collaboration-advisor')
  getCollaborationAdvisor(@Req() req: any) {
    return this.agent.getCollaborationAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get community reputation' })
  @Get('community-reputation')
  getCommunityReputation(@Req() req: any) {
    return this.agent.getCommunityReputation(req.user.companyId, req.user.id);
  }

  @ApiOperation({ summary: 'Get community notifications' })
  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.agent.getNotifications(req.user.companyId, req.user.id);
  }

  @ApiOperation({ summary: 'Get community agent analytics' })
  @Get('analytics')
  getAnalytics(@Req() _req: any) {
    return this.agent.getAnalytics();
  }

  @ApiOperation({ summary: 'Get all community insights' })
  @Get('insights')
  getAllInsights(@Req() req: any) {
    return this.agent.getAllInsights(req.user.companyId, req.user.id);
  }
}
