import { Module } from '@nestjs/common';
import { CatalogAdapterModule } from '../catalog-adapter/catalog-adapter.module';
import { MarketplaceCatalogBridgeController } from './marketplace-catalog-bridge.controller';
import { MarketplaceCatalogBridgeService } from './marketplace-catalog-bridge.service';

@Module({
  imports: [CatalogAdapterModule],
  controllers: [MarketplaceCatalogBridgeController],
  providers: [MarketplaceCatalogBridgeService],
  exports: [MarketplaceCatalogBridgeService],
})
export class MarketplaceCatalogBridgeModule {}