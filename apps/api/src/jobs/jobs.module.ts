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
import { BestsellerProcessor } from './bestseller.processor';
import { JobSchedulerService } from './job-scheduler.service';
import { QueueNames } from './queues';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { ProductsModule } from '../modules/products/products.module';
import { TradTrustService } from '../modules/tradtrust/tradtrust.service';
import { EscrowService, EscrowAnalyticsService } from '../modules/escrow';
import { SettlementService, SettlementAnalyticsService } from '../modules/settlement';
import { DisputeService, DisputeAnalyticsService, AdminService, AdminAssignmentService } from '../modules/dispute';

@Module({
  imports: [
    AnalyticsModule,
    ProductsModule,
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
    TradTrustService,
    EscrowService,
    EscrowAnalyticsService,
    SettlementService,
    SettlementAnalyticsService,
    DisputeService,
    DisputeAnalyticsService,
    AdminService,
    AdminAssignmentService,
    JobSchedulerService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
