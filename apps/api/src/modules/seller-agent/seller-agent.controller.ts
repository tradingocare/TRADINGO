import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { SellerAgentService } from './seller-agent.service';

@ApiTags('Seller Agent')
@Controller('seller/agent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class SellerAgentController {
  constructor(private readonly agent: SellerAgentService) {}

  @ApiOperation({ summary: 'Get seller dashboard copilot' })
  @Get('dashboard-copilot')
  getDashboardCopilot(@Req() req: any) {
    return this.agent.getDashboardCopilot(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get product advisor' })
  @Get('product-advisor')
  getProductAdvisor(@Req() req: any) {
    return this.agent.getProductAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get sales advisor' })
  @Get('sales-advisor')
  getSalesAdvisor(@Req() req: any) {
    return this.agent.getSalesAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get advertising advisor' })
  @Get('advertising-advisor')
  getAdvertisingAdvisor(@Req() req: any) {
    return this.agent.getAdvertisingAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get trust advisor' })
  @Get('trust-advisor')
  getTrustAdvisor(@Req() req: any) {
    return this.agent.getTrustAdvisor(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get growth planner' })
  @Get('growth-planner')
  getGrowthPlanner(@Req() req: any) {
    return this.agent.getGrowthPlanner(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get seller notifications' })
  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.agent.getAiNotifications(req.user.companyId);
  }

  @ApiOperation({ summary: 'Get all seller insights' })
  @Get('insights')
  getAllInsights(@Req() req: any) {
    return this.agent.getAllInsights(req.user.companyId);
  }
}
