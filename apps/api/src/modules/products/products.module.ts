import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ReviewsService } from './reviews.service';
import { WishlistService } from './wishlist.service';
import { QaService } from './qa.service';
import { BestsellerService } from './bestseller.service';
import { BestsellerAnalyticsService } from './bestseller-analytics.service';
import { ProductAttributeDisplayService } from './services/product-attribute-display.service';
import { ProductPricingService } from './services/product-pricing.service';
import { SearchModule } from '../search/search.module';
import { MembershipModule } from '../membership/membership.module';
import { MarketplaceCatalogBridgeModule } from '../marketplace-catalog-bridge/marketplace-catalog-bridge.module';

@Module({
  imports: [SearchModule, MembershipModule, MarketplaceCatalogBridgeModule],
  controllers: [ProductsController],
  providers: [ProductsService, ReviewsService, WishlistService, QaService, BestsellerService, BestsellerAnalyticsService, ProductAttributeDisplayService, ProductPricingService],
  exports: [ProductsService, BestsellerService, BestsellerAnalyticsService, ProductAttributeDisplayService, ProductPricingService],
})
export class ProductsModule {}
