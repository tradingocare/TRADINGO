import { Module } from '@nestjs/common';
import { ProductOnboardingController } from './product-onboarding.controller';
import { ProductOnboardingService } from './product-onboarding.service';
import { SearchModule } from '../modules/search/search.module';
import { MarketplaceCatalogBridgeModule } from '../modules/marketplace-catalog-bridge/marketplace-catalog-bridge.module';

@Module({
  imports: [SearchModule, MarketplaceCatalogBridgeModule],
  controllers: [ProductOnboardingController],
  providers: [ProductOnboardingService],
  exports: [ProductOnboardingService],
})
export class ProductOnboardingModule {}
