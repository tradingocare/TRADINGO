import { Module } from '@nestjs/common';
import { TradTrustService } from './tradtrust.service';
import { TradTrustController } from './tradtrust.controller';
import { TradTrustWeightsService } from './tradtrust-weights.config';
import { SmartRfqModule } from '../smart-rfq/smart-rfq.module';
import { SmartShipmentModule } from '../smart-shipment/smart-shipment.module';
import { SmartNegotiationModule } from '../smart-negotiation/smart-negotiation.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    SmartRfqModule,
    SmartShipmentModule,
    SmartNegotiationModule,
    AnalyticsModule,
  ],
  controllers: [TradTrustController],
  providers: [TradTrustService, TradTrustWeightsService],
  exports: [TradTrustService, TradTrustWeightsService],
})
export class TradTrustModule {}
