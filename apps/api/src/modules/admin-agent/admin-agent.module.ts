import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgentFrameworkModule } from '../agent-framework/agent-framework.module';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { AdminAgentController } from './admin-agent.controller';
import { AdminAgentService } from './admin-agent.service';

@Module({
  imports: [PrismaModule, AgentFrameworkModule],
  controllers: [AdminAgentController],
  providers: [AdminAgentService],
  exports: [AdminAgentService],
})
export class AdminAgentModule implements OnModuleInit {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly service: AdminAgentService,
  ) {}

  onModuleInit() {
    this.registry.register({
      id: 'admin',
      name: 'TradeAI Admin Agent',
      description: 'Platform-wide intelligence, system health, fraud detection, revenue analytics, growth tracking, and moderation oversight',
      version: '1.0.0',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      basePath: '/admin/agent',
      capabilities: [
        { id: 'dashboard-copilot', name: 'Dashboard Copilot', description: 'Platform-wide metrics, priorities, alerts, and quick actions', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'dashboard'] },
        { id: 'system-health', name: 'System Health', description: 'Service status, queue depth, circuit breakers, SLA breaches', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'monitoring'] },
        { id: 'user-activity', name: 'User Activity', description: 'User registrations, active users, churn risk, top users', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'users'] },
        { id: 'fraud-intelligence', name: 'Fraud Intelligence', description: 'Flagged entities, wallet anomalies, high-velocity users, verification issues', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'fraud'] },
        { id: 'revenue-analytics', name: 'Revenue Analytics', description: 'GMV, revenue growth, category/seller/buyer growth, membership/ad/AI revenue', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'revenue'] },
        { id: 'moderation-queue', name: 'Moderation Queue', description: 'Pending reviews, flagged content, reports, community/product moderation', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'moderation'] },
        { id: 'platform-growth', name: 'Platform Growth', description: 'Seller/buyer/product growth, trade volume, RFQ trends', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'growth'] },
        { id: 'performance-metrics', name: 'Performance Metrics', description: 'Latency percentiles, error budget, SLA compliance, worker utilization', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'performance'] },
        { id: 'daily-brief', name: 'Daily Brief', description: 'Morning brief with user/order/revenue metrics and recommended actions', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'brief'] },
        { id: 'all-insights', name: 'All Insights', description: 'Aggregated intelligence from all agent capabilities', dataSources: ['prisma'], executionType: 'direct', tags: ['admin', 'aggregate'] },
      ],
      dependencies: ['PrismaModule', 'AgentFrameworkModule'],
    });
  }
}
