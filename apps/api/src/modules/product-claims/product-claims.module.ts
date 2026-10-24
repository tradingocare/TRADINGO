import { Module } from '@nestjs/common';
import { ProductClaimsController } from './product-claims.controller';
import { ProductClaimsService } from './product-claims.service';
import { MarketplaceCatalogBridgeModule } from '../marketplace-catalog-bridge/marketplace-catalog-bridge.module';

@Module({
  imports: [MarketplaceCatalogBridgeModule],
  controllers: [ProductClaimsController],
  providers: [ProductClaimsService],
  exports: [ProductClaimsService],
})
export class ProductClaimsModule {}
