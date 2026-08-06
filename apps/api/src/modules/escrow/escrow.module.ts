import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowAnalyticsService } from './escrow-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommissionModule } from '../commission/commission.module';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  imports: [AnalyticsModule, CommissionModule, SettlementModule],
  controllers: [EscrowController],
  providers: [EscrowService, EscrowAnalyticsService],
  exports: [EscrowService, EscrowAnalyticsService],
})
export class EscrowModule {}
