import { Module } from '@nestjs/common';
import { SellerAnalyticsController } from './seller-analytics.controller';
import { SellerAnalyticsService } from './seller-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [AnalyticsModule],
  controllers: [SellerAnalyticsController],
  providers: [SellerAnalyticsService, CompanyOwnerGuard],
  exports: [SellerAnalyticsService],
})
export class SellerAnalyticsModule {}
