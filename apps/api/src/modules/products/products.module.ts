import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ReviewsService } from './reviews.service';
import { WishlistService } from './wishlist.service';
import { QaService } from './qa.service';
import { BestsellerService } from './bestseller.service';
import { BestsellerAnalyticsService } from './bestseller-analytics.service';
import { ProductAttributeDisplayService } from './services/product-attribute-display.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService, ReviewsService, WishlistService, QaService, BestsellerService, BestsellerAnalyticsService, ProductAttributeDisplayService],
  exports: [ProductsService, BestsellerService, BestsellerAnalyticsService, ProductAttributeDisplayService],
})
export class ProductsModule {}
