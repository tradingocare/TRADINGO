import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TradeTalkModule } from '../tradetalk/tradetalk.module';
import { AgentFrameworkModule } from '../agent-framework/agent-framework.module';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { AiFederationModule } from '../ai-federation/ai-federation.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { CommunityAgentController } from './community-agent.controller';
import { CommunityAgentService } from './community-agent.service';

@Module({
  imports: [PrismaModule, TradeTalkModule, AgentFrameworkModule, AiFederationModule, TradTrustModule],
  controllers: [CommunityAgentController],
  providers: [CommunityAgentService],
  exports: [CommunityAgentService],
})
export class CommunityAgentModule implements OnModuleInit {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly service: CommunityAgentService,
  ) {}

  onModuleInit() {
    this.registry.register({
      id: 'community',
      name: 'TradeAI Community Agent',
      description: 'Business community intelligence, networking, collaboration discovery, knowledge sharing, and ecosystem growth for TradeTalk',
      version: '1.0.0',
      roles: ['SELLER', 'BUYER', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'],
      basePath: '/community-agent',
      capabilities: [
        { id: 'dashboard-copilot', name: 'Community Dashboard Copilot', description: 'Today\'s discussions, trending industries, recommended communities, networking opportunities, and alerts', dataSources: ['prisma', 'tradetalk'], executionType: 'direct', tags: ['community', 'dashboard'] },
        { id: 'networking-advisor', name: 'Networking Advisor', description: 'Recommended businesses, professionals, industry experts, and potential partners based on TradTrust, industry, location, and community interests', dataSources: ['prisma', 'tradetalk', 'tradtrust'], executionType: 'direct', tags: ['community', 'networking'] },
        { id: 'community-intelligence', name: 'Community Intelligence', description: 'Community growth, engagement, industry trends, inactive community detection, and recommended actions', dataSources: ['prisma', 'tradetalk'], executionType: 'direct', tags: ['community', 'intelligence'] },
        { id: 'knowledge-discovery', name: 'Knowledge Discovery', description: 'Relevant discussions, industry updates, business resources, professional insights, and TradeServ expert recommendations', dataSources: ['prisma', 'tradetalk', 'tradeserv'], executionType: 'direct', tags: ['community', 'knowledge'] },
        { id: 'collaboration-advisor', name: 'Collaboration Advisor', description: 'Potential partnerships, supplier connections, buyer opportunities, TradeServ opportunities, and marketplace opportunities', dataSources: ['prisma', 'tradetalk', 'tradeserv', 'marketplace'], executionType: 'direct', tags: ['community', 'collaboration'] },
        { id: 'community-reputation', name: 'Community Reputation', description: 'Aggregated community participation, professional credibility, TradTrust, contribution score, and leadership score', dataSources: ['prisma', 'tradetalk', 'tradtrust'], executionType: 'direct', tags: ['community', 'reputation'] },
        { id: 'ai-notifications', name: 'AI Notifications', description: 'Daily community digest, trending industries, invitation alerts, discussion highlights, and collaboration opportunities', dataSources: ['prisma', 'tradetalk', 'notifications'], executionType: 'direct', tags: ['community', 'notifications'] },
        { id: 'analytics', name: 'Community Analytics', description: 'Community growth, engagement, AI adoption, networking success, and knowledge contribution tracking', dataSources: ['prisma', 'tradetalk'], executionType: 'direct', tags: ['community', 'analytics'] },
        { id: 'founder-integration', name: 'Founder Executive Integration', description: 'Community health, engagement metrics, growth trends, knowledge activity, and business collaborations for Founder AI', dataSources: ['prisma', 'tradetalk', 'founder'], executionType: 'direct', tags: ['community', 'founder'] },
        { id: 'runtime-integration', name: 'Runtime Integration', description: 'All intelligence executes through AI Runtime, AI Federation, and AI Orchestrator for coordinated multi-agent execution', dataSources: ['runtime', 'federation', 'orchestrator'], executionType: 'direct', tags: ['community', 'runtime'] },
      ],
      dependencies: ['PrismaModule', 'TradeTalkModule', 'AgentFrameworkModule', 'AiFederationModule', 'TradTrustModule'],
    });
  }
}
