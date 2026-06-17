import { Module } from '@nestjs/common';
import { ProductLocationController } from './product-location.controller';
import { ProductLocationManagementController } from './product-location-management.controller';
import { ProductLocationService } from './product-location.service';

@Module({
  controllers: [ProductLocationController, ProductLocationManagementController],
  providers: [ProductLocationService],
  exports: [ProductLocationService],
})
export class ProductLocationModule {}
