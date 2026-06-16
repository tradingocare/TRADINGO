import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationProcessor } from './notification.processor';
import { NotificationTemplateService } from './notification.template.service';
import { NotificationAnalyticsService } from './notification-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { QueueNames } from '../../jobs/queues';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QueueNames.NOTIFICATION }),
    AnalyticsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationProcessor,
    NotificationTemplateService,
    NotificationAnalyticsService,
  ],
  exports: [NotificationService, NotificationGateway, NotificationTemplateService, NotificationAnalyticsService],
})
export class NotificationModule {}
