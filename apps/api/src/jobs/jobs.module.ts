import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { ExportProcessor } from './export.processor';
import { QueueNames } from './queues';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueNames.EMAIL },
      { name: QueueNames.EXPORT },
      { name: QueueNames.NOTIFICATION },
    ),
  ],
  providers: [EmailProcessor, ExportProcessor],
  exports: [BullModule],
})
export class JobsModule {}
