import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { SellerAnalyticsModule } from '../seller-analytics/seller-analytics.module';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { AdvertisingModule } from '../advertising/advertising.module';
import { FounderAiModule } from '../founder-ai/founder-ai.module';
import { SellerAgentController } from './seller-agent.controller';
import { SellerAgentService } from './seller-agent.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    SellerAnalyticsModule,
    TradTrustModule,
    AdvertisingModule,
    FounderAiModule,
  ],
  controllers: [SellerAgentController],
  providers: [SellerAgentService],
  exports: [SellerAgentService],
})
export class SellerAgentModule {}
