import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketIntelligenceService, MarketTrend, DemandSignal } from './market-intelligence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Market Intelligence')
@UseGuards(JwtAuthGuard)
@Controller('market-intelligence')
export class MarketIntelligenceController {
  constructor(private readonly marketIntelligence: MarketIntelligenceService) {}

  @Get('trends')
  @ApiOperation({ summary: 'Get market trends' })
  async getTrends(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ): Promise<MarketTrend[]> {
    return this.marketIntelligence.getMarketTrends({ period, limit: limit ? parseInt(limit, 10) : undefined });
  }

  @Get('demand-signals')
  @ApiOperation({ summary: 'Get demand signals' })
  async getDemandSignals(
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ): Promise<DemandSignal[]> {
    return this.marketIntelligence.getDemandSignals({ categoryId, limit: limit ? parseInt(limit, 10) : undefined });
  }
}
