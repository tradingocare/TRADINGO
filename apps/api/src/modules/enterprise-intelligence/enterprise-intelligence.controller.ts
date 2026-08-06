import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { EnterpriseIntelligenceService } from './enterprise-intelligence.service';

@ApiTags('Enterprise Intelligence')
@Controller('enterprise-intelligence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class EnterpriseIntelligenceController {
  constructor(private readonly service: EnterpriseIntelligenceService) {}

  @Get('full')
  @ApiOperation({ summary: 'Get full enterprise intelligence' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getFullIntelligence() {
    return this.service.getFullIntelligence();
  }

  @Get('digital-twin')
  @ApiOperation({ summary: 'Get digital twin view' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getDigitalTwin() {
    return this.service.getDigitalTwin();
  }

  @Get('health-index')
  @ApiOperation({ summary: 'Get platform health index' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getHealthIndex() {
    return this.service.getHealthIndex();
  }

  @Get('business-confidence')
  @ApiOperation({ summary: 'Get business confidence score' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getBusinessConfidence() {
    return this.service.getBusinessConfidence();
  }

  @Get('supply-demand')
  @ApiOperation({ summary: 'Get supply-demand balance' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getSupplyDemand() {
    return this.service.getSupplyDemandBalance();
  }

  @Get('category-momentum')
  @ApiOperation({ summary: 'Get category momentum metrics' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getCategoryMomentum() {
    return this.service.getCategoryMomentum();
  }

  @Get('regional-heatmap')
  @ApiOperation({ summary: 'Get regional heatmap data' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getRegionalHeatmap() {
    return this.service.getRegionalHeatmap();
  }

  @Get('growth-velocity')
  @ApiOperation({ summary: 'Get growth velocity metrics' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getGrowthVelocity() {
    return this.service.getGrowthVelocity();
  }

  @Get('trust-distribution')
  @ApiOperation({ summary: 'Get trust distribution data' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getTrustDistribution() {
    return this.service.getTrustDistribution();
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get predictive analytics' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getPredictions() {
    return this.service.getPredictions();
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get market opportunities' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getOpportunities() {
    return this.service.getOpportunities();
  }

  @Get('risks')
  @ApiOperation({ summary: 'Get risk intelligence' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getRisks() {
    return this.service.getRisks();
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get strategic recommendations' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getRecommendations() {
    return this.service.getRecommendations();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get enterprise analytics' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAnalytics() {
    return this.service.getEnterpriseAnalytics();
  }
}
