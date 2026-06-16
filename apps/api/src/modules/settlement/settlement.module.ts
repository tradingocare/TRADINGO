import { Module } from '@nestjs/common';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { SettlementAnalyticsService } from './settlement-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  controllers: [SettlementController],
  providers: [SettlementService, SettlementAnalyticsService],
  exports: [SettlementService, SettlementAnalyticsService],
})
export class SettlementModule {}
