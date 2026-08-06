import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueNames } from '../../jobs/queues';
import { PrismaModule } from '../../prisma/prisma.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingProcessor } from './tracking.processor';
import { ClickhouseTrackingProvider } from './providers/clickhouse.provider';
import { Ga4TrackingProvider } from './providers/ga4.provider';
import { UsageEventTrackingProvider } from './providers/usage-event.provider';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueNames.TRACKING }),
    PrismaModule,
  ],
  controllers: [TrackingController],
  providers: [
    TrackingService,
    TrackingProcessor,
    ClickhouseTrackingProvider,
    Ga4TrackingProvider,
    UsageEventTrackingProvider,
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
