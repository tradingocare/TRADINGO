import { Module } from '@nestjs/common';
import { SellerAnalyticsController } from './seller-analytics.controller';
import { SellerAnalyticsService } from './seller-analytics.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [SellerAnalyticsController],
  providers: [SellerAnalyticsService, CompanyOwnerGuard],
  exports: [SellerAnalyticsService],
})
export class SellerAnalyticsModule {}
