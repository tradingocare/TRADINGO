import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { ExportProcessor } from './export.processor';
import { CertificationProcessor } from './certification.processor';
import { SubscriptionProcessor } from './subscription.processor';
import { QueueNames } from './queues';
import { TradTrustService } from '../modules/tradtrust/tradtrust.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueNames.EMAIL },
      { name: QueueNames.EXPORT },
      { name: QueueNames.NOTIFICATION },
      { name: QueueNames.CERTIFICATION },
      { name: QueueNames.SUBSCRIPTION },
    ),
  ],
  providers: [
    EmailProcessor,
    ExportProcessor,
    CertificationProcessor,
    SubscriptionProcessor,
    TradTrustService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
