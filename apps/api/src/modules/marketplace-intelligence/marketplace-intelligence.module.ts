import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketplaceIntelligenceService } from './marketplace-intelligence.service';
import { MarketplaceIntelligenceEngine } from './marketplace-intelligence.engine';
import { CustomerSegmentationService } from './customer-segmentation.service';
import { MarketplaceIntelligenceController } from './marketplace-intelligence.controller';
import { BuyerHistoryService } from './buyer-history.service';
import { LocationIntelligenceModule } from '../location-intelligence/location-intelligence.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { NearMeModule } from '../near-me/near-me.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { FreightIntelligenceModule } from '../freight-intelligence/freight-intelligence.module';
import { MarketIntelligenceModule } from '../market-intelligence/market-intelligence.module';

@Module({
  imports: [
    PrismaModule,
    LocationIntelligenceModule,
    TradTrustModule,
    NearMeModule,
    AnalyticsModule,
    AiGatewayModule,
    FreightIntelligenceModule,
    MarketIntelligenceModule,
  ],
  controllers: [MarketplaceIntelligenceController],
  providers: [MarketplaceIntelligenceService, MarketplaceIntelligenceEngine, BuyerHistoryService, CustomerSegmentationService],
  exports: [MarketplaceIntelligenceService, MarketplaceIntelligenceEngine, BuyerHistoryService, CustomerSegmentationService],
})
export class MarketplaceIntelligenceModule {}
