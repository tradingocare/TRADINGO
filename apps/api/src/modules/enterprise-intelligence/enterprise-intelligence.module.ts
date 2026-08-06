import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { FounderAiModule } from '../founder-ai/founder-ai.module';
import { MarketplaceIntelligenceModule } from '../marketplace-intelligence/marketplace-intelligence.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TradeTalkModule } from '../tradetalk/tradetalk.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { AdvertisingModule } from '../advertising/advertising.module';
import { MembershipModule } from '../membership/membership.module';
import { FinanceModule } from '../finance/finance.module';
import { GocashEcosystemModule } from '../gocash-ecosystem/gocash-ecosystem.module';
import { CrmModule } from '../crm/crm.module';
import { EnterpriseCatalogModule } from '../enterprise-catalog/enterprise-catalog.module';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';
import { AiFederationModule } from '../ai-federation/ai-federation.module';
import { EnterpriseIntelligenceService } from './enterprise-intelligence.service';
import { EnterpriseIntelligenceController } from './enterprise-intelligence.controller';

@Module({
  imports: [
    FounderAiModule,
    MarketplaceIntelligenceModule,
    AnalyticsModule,
    TradeTalkModule,
    TradTrustModule,
    AdvertisingModule,
    MembershipModule,
    FinanceModule,
    GocashEcosystemModule,
    CrmModule,
    EnterpriseCatalogModule,
    AiRuntimeModule,
    AiFederationModule,
  ],
  controllers: [EnterpriseIntelligenceController],
  providers: [EnterpriseIntelligenceService, PrismaService],
  exports: [EnterpriseIntelligenceService],
})
export class EnterpriseIntelligenceModule implements OnModuleInit {
  private readonly logger = new Logger(EnterpriseIntelligenceModule.name);

  constructor(
    private readonly registry: AgentRegistryService,
    private readonly service: EnterpriseIntelligenceService,
  ) {}

  onModuleInit() {
    this.registry.register({
      id: 'enterprise-intelligence',
      name: 'Enterprise Commerce Intelligence',
      description: 'Autonomous platform intelligence layer — Digital Twin, health indices, forecasts, opportunities, risks, and recommendations aggregated from 18 existing services',
      version: '1.0.0',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      basePath: '/enterprise-intelligence',
      capabilities: [
        { id: 'digital-twin', name: 'Digital Twin', description: 'Continuous holistic snapshot of marketplace, trust, growth, ecosystem, AI, and membership', dataSources: ['Prisma', 'FounderAi', 'MarketplaceIntelligence', 'TradTrust', 'Analytics'], executionType: 'direct', tags: ['intelligence', 'platform', 'overview'] },
        { id: 'health-index', name: 'Platform Health Index', description: '7-dimension weighted platform health score', dataSources: ['Prisma', 'Analytics', 'TradTrust', 'MarketplaceIntelligence'], executionType: 'direct', tags: ['intelligence', 'health', 'platform'] },
        { id: 'business-confidence', name: 'Business Confidence Index', description: '6-factor aggregate confidence measure combining participation, trade velocity, growth, trust, AI adoption, and ecosystem engagement', dataSources: ['Prisma', 'Analytics', 'TradTrust', 'GocashEcosystem', 'AiRuntime'], executionType: 'direct', tags: ['intelligence', 'confidence', 'business'] },
        { id: 'supply-demand', name: 'Supply-Demand Balance', description: 'Per-category product vs RFQ analysis to identify oversupply and shortages', dataSources: ['Prisma', 'MarketplaceIntelligence'], executionType: 'direct', tags: ['intelligence', 'market', 'catalog'] },
        { id: 'category-momentum', name: 'Category Momentum', description: 'Per-category growth scoring with trend direction and velocity', dataSources: ['Prisma', 'Analytics', 'MarketplaceIntelligence'], executionType: 'direct', tags: ['intelligence', 'catalog', 'trends'] },
        { id: 'regional-heatmap', name: 'Regional Trade Heatmap', description: 'Geographic trade activity aggregated by city and state', dataSources: ['Prisma', 'Analytics'], executionType: 'direct', tags: ['intelligence', 'geography', 'trade'] },
        { id: 'growth-velocity', name: 'Growth Velocity', description: 'Period-over-period growth rates for companies, revenue, and orders', dataSources: ['Prisma', 'Analytics'], executionType: 'direct', tags: ['intelligence', 'growth', 'metrics'] },
        { id: 'trust-distribution', name: 'Trust Distribution', description: 'TradTrust grade distribution, verification funnel, and risk thresholds', dataSources: ['TradTrust', 'Prisma'], executionType: 'direct', tags: ['intelligence', 'trust', 'verification'] },
        { id: 'predictions', name: 'Market Predictions', description: '30-day rolling forecasts for orders, GMV, memberships, AI adoption, and user growth', dataSources: ['Prisma', 'Analytics', 'Membership', 'AiRuntime'], executionType: 'direct', tags: ['intelligence', 'forecast', 'predictions'] },
        { id: 'opportunities', name: 'Opportunity Engine', description: 'Emerging industries, supply shortages, high-growth regions, and cross-selling opportunities', dataSources: ['Prisma', 'MarketplaceIntelligence', 'Analytics', 'FounderAi'], executionType: 'direct', tags: ['intelligence', 'opportunities', 'growth'] },
        { id: 'risks', name: 'Risk Intelligence', description: 'Fraud spikes, queue congestion, infrastructure anomalies, and churn signals', dataSources: ['Prisma', 'AiRuntime', 'AiFederation', 'Analytics', 'TradTrust'], executionType: 'direct', tags: ['intelligence', 'risks', 'security'] },
        { id: 'recommendations', name: 'Autonomous Recommendations', description: 'Role-based actionable recommendations for marketplace health, seller success, and buyer experience', dataSources: ['Prisma', 'FounderAi', 'MarketplaceIntelligence', 'TradTrust'], executionType: 'direct', tags: ['intelligence', 'recommendations', 'actions'] },
        { id: 'enterprise-analytics', name: 'Enterprise Analytics', description: 'AI runtime stats, federation collaboration metrics, advertising performance, and notification throughput', dataSources: ['AiRuntime', 'AiFederation', 'Advertising', 'Prisma'], executionType: 'direct', tags: ['intelligence', 'analytics', 'operations'] },
        { id: 'full-intelligence', name: 'Full Enterprise Intelligence', description: 'Aggregated response combining all 13 intelligence dimensions into a single payload', dataSources: ['All'], executionType: 'direct', tags: ['intelligence', 'full', 'overview'] },
      ],
      dependencies: ['FounderAiModule', 'MarketplaceIntelligenceModule', 'AnalyticsModule', 'TradTrustModule', 'AiRuntimeModule', 'AiFederationModule'],
    });
    this.logger.log('Registered Enterprise Intelligence agent with 14 capabilities');
  }
}
