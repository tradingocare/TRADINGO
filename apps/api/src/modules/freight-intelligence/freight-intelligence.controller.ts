import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FreightIntelligenceService, FreightEstimate, FreightAnalytics } from './freight-intelligence.service';
import { FreightEstimateDto, FreightAnalyticsQueryDto } from './dto/freight.dto';

@ApiTags('Freight Intelligence')
@UseGuards(JwtAuthGuard)
@Controller('freight-intelligence')
export class FreightIntelligenceController {
  constructor(private readonly freightIntelligence: FreightIntelligenceService) {}

  @Post('estimate')
  @ApiOperation({ summary: 'Estimate freight cost' })
  async estimateFreight(@Body() body: FreightEstimateDto): Promise<FreightEstimate> {
    return this.freightIntelligence.estimateFreight({
      originLat: body.originLat,
      originLng: body.originLng,
      destLat: body.destLat,
      destLng: body.destLng,
      weight: body.weight,
      weightUnit: body.weightUnit,
      shipmentType: body.shipmentType,
      packages: body.packages,
    });
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get freight analytics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAnalytics(@Query() query: FreightAnalyticsQueryDto): Promise<FreightAnalytics> {
    return this.freightIntelligence.getCarrierAnalytics({
      period: query.period,
      limit: query.limit,
    });
  }
}
