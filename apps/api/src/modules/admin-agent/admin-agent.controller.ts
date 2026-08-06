import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { AdminAgentService } from './admin-agent.service';
import {
  AdminDashboardCopilotResponse, SystemHealthResponse, UserActivityResponse,
  FraudIntelligenceResponse, RevenueAnalyticsResponse, ModerationQueueResponse,
  PlatformGrowthResponse, PerformanceMetricsResponse, DailyBriefResponse, AdminAgentAllInsightsResponse,
} from './dto/admin-agent.dto';

@ApiTags('Admin Agent')
@Controller('admin/agent')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class AdminAgentController {
  constructor(private readonly agent: AdminAgentService) {}

  @ApiOperation({ summary: 'Get admin dashboard copilot' })
  @Get('dashboard-copilot')
  getDashboardCopilot(): Promise<AdminDashboardCopilotResponse> {
    return this.agent.getDashboardCopilot();
  }

  @ApiOperation({ summary: 'Get system health' })
  @Get('system-health')
  getSystemHealth(): Promise<SystemHealthResponse> {
    return this.agent.getSystemHealth();
  }

  @ApiOperation({ summary: 'Get user activity' })
  @Get('user-activity')
  getUserActivity(): Promise<UserActivityResponse> {
    return this.agent.getUserActivity();
  }

  @ApiOperation({ summary: 'Get fraud intelligence' })
  @Get('fraud-intelligence')
  getFraudIntelligence(): Promise<FraudIntelligenceResponse> {
    return this.agent.getFraudIntelligence();
  }

  @ApiOperation({ summary: 'Get revenue analytics' })
  @Get('revenue-analytics')
  getRevenueAnalytics(): Promise<RevenueAnalyticsResponse> {
    return this.agent.getRevenueAnalytics();
  }

  @ApiOperation({ summary: 'Get moderation queue' })
  @Get('moderation-queue')
  getModerationQueue(): Promise<ModerationQueueResponse> {
    return this.agent.getModerationQueue();
  }

  @ApiOperation({ summary: 'Get platform growth' })
  @Get('platform-growth')
  getPlatformGrowth(): Promise<PlatformGrowthResponse> {
    return this.agent.getPlatformGrowth();
  }

  @ApiOperation({ summary: 'Get performance metrics' })
  @Get('performance-metrics')
  getPerformanceMetrics(): Promise<PerformanceMetricsResponse> {
    return this.agent.getPerformanceMetrics();
  }

  @ApiOperation({ summary: 'Get daily brief' })
  @Get('daily-brief')
  getDailyBrief(): Promise<DailyBriefResponse> {
    return this.agent.getDailyBrief();
  }

  @ApiOperation({ summary: 'Get all admin insights' })
  @Get('insights')
  getAllInsights(): Promise<AdminAgentAllInsightsResponse> {
    return this.agent.getAllInsights();
  }
}
