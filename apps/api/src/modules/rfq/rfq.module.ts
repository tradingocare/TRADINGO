import { Module } from '@nestjs/common';
import { RfqController } from './rfq.controller';
import { RfqService } from './rfq.service';
import { RfqNumberService } from './rfq-number.service';
import { RfqAnalyticsService } from './rfq-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [AnalyticsModule],
  controllers: [RfqController],
  providers: [RfqService, RfqNumberService, RfqAnalyticsService, CompanyOwnerGuard],
  exports: [RfqService, RfqNumberService, RfqAnalyticsService],
})
export class RfqModule {}
