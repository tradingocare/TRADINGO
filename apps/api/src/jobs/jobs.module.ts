import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { ExportProcessor } from './export.processor';
import { CertificationProcessor } from './certification.processor';
import { SubscriptionProcessor } from './subscription.processor';
import { RfqProcessor } from './rfq.processor';
import { EscrowProcessor } from './escrow.processor';
import { SettlementProcessor } from './settlement.processor';
import { DisputeProcessor } from './dispute.processor';
import { AiProcessor } from './ai.processor';
import { BestsellerProcessor } from './bestseller.processor';
import { JobSchedulerService } from './job-scheduler.service';
import { QueueNames } from './queues';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { ProductsModule } from '../modules/products/products.module';
import { TradTrustModule } from '../modules/tradtrust/tradtrust.module';
import { AiGatewayModule } from '../modules/ai-gateway/ai-gateway.module';
import { AiOrchestratorModule } from '../modules/ai-orchestrator/ai-orchestrator.module';
import { AiRuntimeModule } from '../modules/ai-runtime/ai-runtime.module';
import { EscrowService, EscrowAnalyticsService } from '../modules/escrow';
import { SettlementService, SettlementAnalyticsService } from '../modules/settlement';
import { DisputeService, DisputeAnalyticsService, AdminService, AdminAssignmentService } from '../modules/dispute';
import { PayoutService } from '../modules/payout/payout.service';
import { PayoutProcessor } from './payout.processor';
import { CommissionModule } from '../modules/commission/commission.module';
import { PayoutModule } from '../modules/payout/payout.module';

@Module({
  imports: [
    AnalyticsModule,
    ProductsModule,
    TradTrustModule,
    AiGatewayModule,
    AiOrchestratorModule,
    AiRuntimeModule,
    CommissionModule,
    PayoutModule,
    BullModule.registerQueue(
      { name: QueueNames.EMAIL },
      { name: QueueNames.EXPORT },
      { name: QueueNames.NOTIFICATION },
      { name: QueueNames.CERTIFICATION },
      { name: QueueNames.SUBSCRIPTION },
      { name: QueueNames.RFQ },
      { name: QueueNames.ESCROW },
      { name: QueueNames.SETTLEMENT },
      { name: QueueNames.DISPUTE },
      { name: QueueNames.ANALYTICS },
      { name: QueueNames.MALWARE },
      { name: QueueNames.BESTSELLER },
      { name: QueueNames.AI },
      { name: QueueNames.TRACKING },
      { name: QueueNames.PAYOUT },
    ),
  ],
  providers: [
    EmailProcessor,
    ExportProcessor,
    CertificationProcessor,
    SubscriptionProcessor,
    RfqProcessor,
    EscrowProcessor,
    SettlementProcessor,
    DisputeProcessor,
    BestsellerProcessor,
    AiProcessor,
    PayoutProcessor,
    EscrowService,
    EscrowAnalyticsService,
    SettlementService,
    SettlementAnalyticsService,
    DisputeService,
    DisputeAnalyticsService,
    AdminService,
    AdminAssignmentService,
    PayoutService,
    JobSchedulerService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
