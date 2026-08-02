import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GrowthIntelligenceService } from './growth-intelligence.service';
import { GrowthQueryDto } from './dto/growth-intelligence.dto';
import { CohortQueryDto } from './dto/growth-extended.dto';

@ApiTags('Growth Intelligence')
@Controller('growth-intelligence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class GrowthIntelligenceController {
  constructor(private readonly service: GrowthIntelligenceService) {}

  @Get('acquisition-funnel')
  @ApiOperation({ summary: 'Visitor → Registration → Order funnel' })
  getAcquisitionFunnel(@Query() query: GrowthQueryDto) {
    return this.service.getAcquisitionFunnel(query.days);
  }

  @Get('campaign-performance')
  @ApiOperation({ summary: 'Campaign breakdown by UTM params' })
  getCampaignPerformance(@Query() query: GrowthQueryDto) {
    return this.service.getCampaignPerformance(query.days);
  }

  @Get('referral-conversion')
  @ApiOperation({ summary: 'Referral usage → reward conversion' })
  getReferralConversion(@Query() query: GrowthQueryDto) {
    return this.service.getReferralConversion(query.days);
  }

  @Get('lead-conversion')
  @ApiOperation({ summary: 'Lead source → conversion pipeline' })
  getLeadConversion(@Query() query: GrowthQueryDto) {
    return this.service.getLeadConversion(query.days);
  }

  @Get('top-landing-pages')
  @ApiOperation({ summary: 'Top 20 landing pages by visits' })
  getTopLandingPages(@Query() query: GrowthQueryDto) {
    return this.service.getTopLandingPages(query.days);
  }

  @Get('traffic-sources')
  @ApiOperation({ summary: 'Traffic channel breakdown' })
  getTrafficSources(@Query() query: GrowthQueryDto) {
    return this.service.getTrafficSources(query.days);
  }

  @Get('summary')
  @ApiOperation({ summary: 'All growth intelligence in one response' })
  getGrowthSummary(@Query() query: GrowthQueryDto) {
    return this.service.getGrowthSummary(query.days);
  }

  @Get('cohort-analysis')
  @ApiOperation({ summary: 'Monthly cohort retention analysis' })
  getCohortAnalysis(@Query() query: CohortQueryDto) {
    return this.service.getCohortAnalysis(query.months);
  }

  @Get('retention')
  @ApiOperation({ summary: 'D7/D30/D90 retention rates with cohort breakdown' })
  getRetentionAnalysis(@Query() query: CohortQueryDto) {
    return this.service.getRetentionAnalysis(query.months);
  }

  @Get('ltv')
  @ApiOperation({ summary: 'Customer lifetime value analysis by cohort and plan' })
  getLtvAnalysis() {
    return this.service.getLtvAnalysis();
  }

  @Get('cac')
  @ApiOperation({ summary: 'Customer acquisition cost by channel with LTV/CAC ratio' })
  getCacAnalysis() {
    return this.service.getCacAnalysis();
  }

  @Get('attribution')
  @ApiOperation({ summary: 'Multi-touch channel attribution (first/last/linear)' })
  getChannelAttribution(@Query() query: GrowthQueryDto) {
    return this.service.getChannelAttribution(query.days);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Growth KPIs with period-over-period comparison' })
  getGrowthKpis(@Query() query: GrowthQueryDto) {
    return this.service.getGrowthKpis(query.days);
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Full acquisition funnel analytics' })
  getFunnelAnalytics(@Query() query: GrowthQueryDto) {
    return this.service.getFunnelAnalytics(query.days);
  }
}
