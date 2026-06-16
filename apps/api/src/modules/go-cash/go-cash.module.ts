import { Module } from '@nestjs/common';
import { GoCashController } from './go-cash.controller';
import { GoCashService } from './go-cash.service';
import { GoCashAnalyticsService } from './gocash-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [AnalyticsModule],
  controllers: [GoCashController],
  providers: [GoCashService, GoCashAnalyticsService, CompanyOwnerGuard],
  exports: [GoCashService, GoCashAnalyticsService],
})
export class GoCashModule {}
