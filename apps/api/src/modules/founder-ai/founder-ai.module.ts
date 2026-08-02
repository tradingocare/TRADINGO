import { Module } from '@nestjs/common'
import { FounderAiAggregatorService } from './founder-ai.service'
import { FounderAiController } from './founder-ai.controller'
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module'
import { AnalyticsModule } from '../analytics/analytics.module'
import { MarketplaceIntelligenceModule } from '../marketplace-intelligence/marketplace-intelligence.module'
import { TradeTalkModule } from '../tradetalk/tradetalk.module'
import { TradTrustModule } from '../tradtrust/tradtrust.module'
import { GocashEcosystemModule } from '../gocash-ecosystem/gocash-ecosystem.module'
import { AdvertisingModule } from '../advertising/advertising.module'
import { FinanceModule } from '../finance/finance.module'

@Module({
  imports: [
    AiGatewayModule,
    AnalyticsModule,
    MarketplaceIntelligenceModule,
    TradeTalkModule,
    TradTrustModule,
    GocashEcosystemModule,
    AdvertisingModule,
    FinanceModule,
  ],
  controllers: [FounderAiController],
  providers: [FounderAiAggregatorService],
  exports: [FounderAiAggregatorService],
})
export class FounderAiModule {}
