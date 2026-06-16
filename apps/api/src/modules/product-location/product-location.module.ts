import { Module } from '@nestjs/common';
import { ProductLocationController } from './product-location.controller';
import { ProductLocationService } from './product-location.service';

@Module({
  controllers: [ProductLocationController],
  providers: [ProductLocationService],
  exports: [ProductLocationService],
})
export class ProductLocationModule {}
