import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { BuyerAgentService } from './buyer-agent.service';

@ApiTags('Buyer Agent')
@Controller('buyer/agent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class BuyerAgentController {
  constructor(private readonly agent: BuyerAgentService) {}

  @ApiOperation({ summary: 'Get buyer dashboard copilot' })
  @Get('dashboard-copilot')
  getDashboardCopilot(@Req() req: any) {
    return this.agent.getDashboardCopilot(req.user.id);
  }

  @ApiOperation({ summary: 'Get smart procurement advice' })
  @Get('smart-procurement')
  getSmartProcurement(@Req() req: any) {
    return this.agent.getSmartProcurement(req.user.id);
  }

  @ApiOperation({ summary: 'Get RFQ assistant' })
  @Get('rfq-assistant')
  getRfqAssistant(@Req() req: any) {
    return this.agent.getRfqAssistant(req.user.id);
  }

  @ApiOperation({ summary: 'Get supplier intelligence' })
  @Get('supplier-intelligence')
  getSupplierIntelligence(@Req() req: any) {
    return this.agent.getSupplierIntelligence(req.user.id);
  }

  @ApiOperation({ summary: 'Get negotiation advisor' })
  @Get('negotiation-advisor')
  getNegotiationAdvisor(@Req() req: any) {
    return this.agent.getNegotiationAdvisor(req.user.id);
  }

  @ApiOperation({ summary: 'Get cost optimization' })
  @Get('cost-optimization')
  getCostOptimization(@Req() req: any) {
    return this.agent.getCostOptimization(req.user.id);
  }

  @ApiOperation({ summary: 'Get buyer notifications' })
  @Get('notifications')
  getBuyerNotifications(@Req() req: any) {
    return this.agent.getBuyerNotifications(req.user.id);
  }

  @ApiOperation({ summary: 'Get all buyer insights' })
  @Get('insights')
  getAllInsights(@Req() req: any) {
    return this.agent.getAllInsights(req.user.id);
  }
}
