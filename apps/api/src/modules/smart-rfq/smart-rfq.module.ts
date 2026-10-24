import { Module } from '@nestjs/common';
import { RfqModule } from '../rfq/rfq.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { CatalogAdapterModule } from '../catalog-adapter/catalog-adapter.module';
import { MarketplaceCatalogBridgeModule } from '../marketplace-catalog-bridge/marketplace-catalog-bridge.module';
import { OrderModule } from '../order/order.module';
import { SmartRfqController } from './smart-rfq.controller';
import { SmartRfqService } from './smart-rfq.service';
import { AiRfqService } from './ai-rfq.service';
import { NearToFarService } from './near-to-far.service';
import { RfqSellerService } from './rfq-seller.service';
import { RfqAdminService } from './rfq-admin.service';

@Module({
  imports: [RfqModule, AiGatewayModule, CatalogAdapterModule, MarketplaceCatalogBridgeModule, OrderModule],
  controllers: [SmartRfqController],
  providers: [SmartRfqService, AiRfqService, NearToFarService, RfqSellerService, RfqAdminService],
  exports: [SmartRfqService, AiRfqService],
})
export class SmartRfqModule {}
