import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService, DashboardQuery } from './analytics.service';
import { EventIngestionService } from './event-ingestion.service';
import { AnalyticsTable } from './clickhouse.service';
import { TrackEventDto } from './dto/track-event.dto';
import { TrackBatchEventDto } from './dto/track-batch-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly eventIngestionService: EventIngestionService,
  ) {}

  @Get('seller/:companyId/dashboard')
  @ApiOperation({ summary: 'Seller dashboard overview' })
  async getSellerDashboard(
    @Param('companyId') companyId: string,
    @Query() query: DashboardQuery,
  ) {
    return this.analyticsService.getSellerDashboard(companyId, query);
  }

  @Get('seller/:companyId/daily')
  @ApiOperation({ summary: 'Seller daily metrics' })
  async getSellerDaily(
    @Param('companyId') companyId: string,
    @Query() query: DashboardQuery,
  ) {
    return this.analyticsService.getSellerDailyMetrics(companyId, query);
  }

  @Get('seller/:companyId/charts')
  @ApiOperation({ summary: 'Seller chart data' })
  async getCharts(
    @Param('companyId') companyId: string,
    @Query() query: DashboardQuery,
  ) {
    return this.analyticsService.getCharts(companyId, query);
  }

  @Get('seller/:companyId/leaderboard')
  @ApiOperation({ summary: 'Seller leaderboard position' })
  async getLeaderboardPosition(@Param('companyId') companyId: string) {
    return this.analyticsService.getSellerLeaderboardPosition(companyId);
  }

  @Get('admin/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin dashboard overview' })
  async getAdminDashboard(@Query() query: DashboardQuery) {
    return this.analyticsService.getAdminDashboard(query);
  }

  @Get('admin/completion-rate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin order completion rate metrics' })
  async getCompletionRate(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analyticsService.getCompletionRate(startDate, endDate);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top sellers leaderboard' })
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.analyticsService.getSellerLeaderboard(limit ? parseInt(limit, 10) : 100);
  }

  @Post('track/:table')
  @ApiOperation({ summary: 'Track an analytics event' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async trackEvent(
    @Param('table') table: AnalyticsTable,
    @Body() dto: TrackEventDto,
  ) {
    await this.eventIngestionService.track(table, dto);
    return { accepted: true };
  }

  @Post('track-batch/:table')
  @ApiOperation({ summary: 'Track batch analytics events' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async trackBatch(
    @Param('table') table: AnalyticsTable,
    @Body() dto: TrackBatchEventDto,
  ) {
    await this.eventIngestionService.trackBatch(table, dto.events);
    return { accepted: true, count: dto.events.length };
  }

  @Get('queue-depth')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Analytics queue depth' })
  getQueueDepth() {
    return {
      sellerEvents: this.eventIngestionService.getBatchSize('seller_analytics_events'),
      rfqEvents: this.eventIngestionService.getBatchSize('rfq_analytics_events'),
      orderEvents: this.eventIngestionService.getBatchSize('order_analytics_events'),
      chatEvents: this.eventIngestionService.getBatchSize('chat_analytics_events'),
      disputeEvents: this.eventIngestionService.getBatchSize('dispute_analytics_events'),
      deadLetter: this.eventIngestionService.getDeadLetterCount(),
    };
  }

  @Post('flush')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Force flush all pending events' })
  async flush() {
    await this.eventIngestionService.flush();
    return { flushed: true };
  }

  @Get('admin/revenue-kpis')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revenue KPIs (MRR/ARR/churn)' })
  async getRevenueKpis() {
    return this.analyticsService.getRevenueKpis();
  }

  @Get('admin/subscription-metrics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Subscription metrics' })
  async getSubscriptionMetrics() {
    return this.analyticsService.getSubscriptionMetrics();
  }
}
