import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommerceIntelligenceService } from './commerce-intelligence.service';

@ApiTags('Commerce Intelligence')
@Controller('ai/commerce')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommerceIntelligenceController {
  constructor(private readonly service: CommerceIntelligenceService) {}

  @ApiOperation({ summary: 'Get sales potential for product' })
  @Get('sales-potential/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getSalesPotential(@Param('productId') productId: string) {
    return this.service.getSalesPotential(productId);
  }

  @ApiOperation({ summary: 'Get suggested price for product' })
  @Get('suggested-price/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getSuggestedPrice(@Param('productId') productId: string) {
    return this.service.getSuggestedPrice(productId);
  }

  @ApiOperation({ summary: 'Get demand trend for product' })
  @Get('demand-trend/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getDemandTrend(@Param('productId') productId: string) {
    return this.service.getDemandTrend(productId);
  }

  @ApiOperation({ summary: 'Get competition analysis for product' })
  @Get('competition/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getCompetitionAnalysis(@Param('productId') productId: string) {
    return this.service.getCompetitionAnalysis(productId);
  }

  @ApiOperation({ summary: 'Get advertising suggestions for product' })
  @Get('advertising/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getSuggestedAdvertising(@Param('productId') productId: string) {
    return this.service.getSuggestedAdvertising(productId);
  }

  @ApiOperation({ summary: 'Get full commerce insights for product' })
  @Get('full-insights/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getFullCommerceInsights(@Param('productId') productId: string) {
    return this.service.getFullCommerceInsights(productId);
  }
}
