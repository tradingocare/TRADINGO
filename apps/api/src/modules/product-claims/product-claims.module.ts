import { Module } from '@nestjs/common';
import { ProductClaimsController } from './product-claims.controller';
import { ProductClaimsService } from './product-claims.service';

@Module({
  controllers: [ProductClaimsController],
  providers: [ProductClaimsService],
  exports: [ProductClaimsService],
})
export class ProductClaimsModule {}
