import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellerAnalyticsService } from './seller-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { AnalyticsQueryDto, AnalyticsTimeRange } from './dto/analytics-query.dto';

@ApiTags('Seller Analytics')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/analytics')
export class SellerAnalyticsController {
  constructor(private readonly analyticsService: SellerAnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary' })
  async getDashboard(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getDashboardSummary(companyId, query.range);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get charts data' })
  async getCharts(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getCharts(companyId, query.range);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  async getPerformance(
    @Param('companyId') companyId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getPerformanceMetrics(companyId, query.range);
  }
}
