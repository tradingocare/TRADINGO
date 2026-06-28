import { Module } from '@nestjs/common';
import { SellerProductController } from './seller-product.controller';
import { SellerProductService } from './seller-product.service';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { MediaLibraryController } from './media-library.controller';
import { MediaLibraryService } from './media-library.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { BulkOperationsService } from './bulk-operations.service';
import { ProductAnalyticsController } from './product-analytics.controller';
import { ProductAnalyticsService } from './product-analytics.service';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { ProductExportController } from './product-export.controller';
import { ProductExportService } from './product-export.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [
    SellerProductController,
    ApprovalController,
    MediaLibraryController,
    BulkOperationsController,
    ProductAnalyticsController,
    BrandController,
    ProductExportController,
  ],
  providers: [
    SellerProductService,
    ApprovalService,
    MediaLibraryService,
    BulkOperationsService,
    ProductAnalyticsService,
    BrandService,
    ProductExportService,
  ],
  exports: [SellerProductService, ApprovalService],
})
export class SellerProductModule {}
