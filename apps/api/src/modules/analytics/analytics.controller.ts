import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService, DashboardQuery } from './analytics.service';
import { EventIngestionService, AnalyticsEvent } from './event-ingestion.service';
import { AnalyticsTable } from './clickhouse.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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
  @ApiOperation({ summary: 'Admin dashboard overview' })
  async getAdminDashboard(@Query() query: DashboardQuery) {
    return this.analyticsService.getAdminDashboard(query);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top sellers leaderboard' })
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.analyticsService.getSellerLeaderboard(limit ? parseInt(limit, 10) : 100);
  }

  @Post('track/:table')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(
    @Param('table') table: AnalyticsTable,
    @Body() event: AnalyticsEvent,
  ) {
    await this.eventIngestionService.track(table, event);
    return { accepted: true };
  }

  @Post('track-batch/:table')
  @ApiOperation({ summary: 'Track batch analytics events' })
  async trackBatch(
    @Param('table') table: AnalyticsTable,
    @Body() body: { events: AnalyticsEvent[] },
  ) {
    await this.eventIngestionService.trackBatch(table, body.events);
    return { accepted: true, count: body.events.length };
  }

  @Get('queue-depth')
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
  @ApiOperation({ summary: 'Force flush all pending events' })
  async flush() {
    await this.eventIngestionService.flush();
    return { flushed: true };
  }

  @Post('query')
  @ApiOperation({ summary: 'Raw ClickHouse query' })
  async rawQuery(@Body() body: { sql: string; params?: Record<string, unknown> }) {
    return this.analyticsService.queryRaw(body.sql, body.params);
  }
}
