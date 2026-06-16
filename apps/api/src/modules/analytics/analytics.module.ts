import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ClickhouseService } from './clickhouse.service';
import { EventIngestionService } from './event-ingestion.service';
import { AnalyticsProcessor } from './analytics.processor';
import { QueueNames } from '../../jobs/queues';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueNames.ANALYTICS }),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    ClickhouseService,
    EventIngestionService,
    AnalyticsProcessor,
  ],
  exports: [
    AnalyticsService,
    ClickhouseService,
    EventIngestionService,
  ],
})
export class AnalyticsModule {}
