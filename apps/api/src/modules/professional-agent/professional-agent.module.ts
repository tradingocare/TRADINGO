import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TradeservModule } from '../tradeserv/tradeserv.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { AgentFrameworkModule } from '../agent-framework/agent-framework.module';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { AiFederationModule } from '../ai-federation/ai-federation.module';
import { ProfessionalAgentController } from './professional-agent.controller';
import { ProfessionalAgentService } from './professional-agent.service';

@Module({
  imports: [PrismaModule, TradeservModule, TradTrustModule, AgentFrameworkModule, AiFederationModule],
  controllers: [ProfessionalAgentController],
  providers: [ProfessionalAgentService],
  exports: [ProfessionalAgentService],
})
export class ProfessionalAgentModule implements OnModuleInit {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly service: ProfessionalAgentService,
  ) {}

  onModuleInit() {
    this.registry.register({
      id: 'professional',
      name: 'TradeAI Professional Agent',
      description: 'Client acquisition advisor, proposal intelligence, portfolio review, reputation management, revenue planning, and TradeTalk network integration for TradeServ professionals',
      version: '1.0.0',
      roles: ['SELLER', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'],
      basePath: '/professional-agent',
      capabilities: [
        { id: 'dashboard-copilot', name: 'Dashboard Copilot', description: 'Priorities, opportunities, proposals, inquiries, trust, and quick actions', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'dashboard'] },
        { id: 'client-acquisition', name: 'Client Acquisition Advisor', description: 'Marketplace demand, RFQs, trends, nearby opportunities, and TradeTalk community recommendations', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'acquisition'] },
        { id: 'proposal-intelligence', name: 'Proposal Intelligence', description: 'Win probability, pricing guidance, risk indicators, and follow-up suggestions', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'proposals'] },
        { id: 'portfolio-intelligence', name: 'Portfolio Intelligence', description: 'Quality scoring, coverage gaps, missing industries, media quality assessment, and improvement suggestions', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'portfolio'] },
        { id: 'reputation-advisor', name: 'Reputation Advisor', description: 'TradTrust score analysis, review insights, response rate, verification status, and improvement plan', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'reputation'] },
        { id: 'revenue-planner', name: 'Revenue Planner', description: 'Revenue goals, pipeline tracking, monthly forecasts, conversion opportunities, and actionable recommendations', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'revenue'] },
        { id: 'ai-notifications', name: 'AI Notifications', description: 'Daily digest, proposal reminders, lead alerts, review/trust milestones, and opportunity alerts', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'notifications'] },
        { id: 'tradetalk-integration', name: 'TradeTalk Network Integration', description: 'Community recommendations, active discussions, networking suggestions, and ecosystem insights', dataSources: ['prisma'], executionType: 'direct', tags: ['professional', 'tradetalk'] },
      ],
      dependencies: ['PrismaModule', 'TradeservModule', 'AgentFrameworkModule', 'AiFederationModule'],
    });
  }
}
