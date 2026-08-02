import { Module } from '@nestjs/common';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { SettlementAnalyticsService } from './settlement-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PayoutModule } from '../payout/payout.module';

@Module({
  imports: [AnalyticsModule, PayoutModule],
  controllers: [SettlementController],
  providers: [SettlementService, SettlementAnalyticsService],
  exports: [SettlementService, SettlementAnalyticsService],
})
export class SettlementModule {}
