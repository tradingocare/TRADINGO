import { Module } from '@nestjs/common';
import { CatalogAdapterModule } from '../catalog-adapter/catalog-adapter.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { EnterpriseCatalogModule } from '../enterprise-catalog/enterprise-catalog.module';
import { MarketplaceCatalogBridgeController } from './marketplace-catalog-bridge.controller';
import { MarketplaceCatalogBridgeService } from './marketplace-catalog-bridge.service';
import { CatalogClassifyController } from './catalog-classify.controller';
import { CatalogClassifyService } from './catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from './catalog-taxonomy-persistence.service';

@Module({
  imports: [CatalogAdapterModule, AiGatewayModule, EnterpriseCatalogModule],
  controllers: [MarketplaceCatalogBridgeController, CatalogClassifyController],
  providers: [MarketplaceCatalogBridgeService, CatalogClassifyService, CatalogTaxonomyPersistenceService],
  exports: [MarketplaceCatalogBridgeService, CatalogClassifyService, CatalogTaxonomyPersistenceService],
})
export class MarketplaceCatalogBridgeModule {}