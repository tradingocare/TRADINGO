import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { DisputeAnalyticsService } from './dispute-analytics.service';
import { AdminService } from './admin.service';
import { AdminAssignmentService } from './admin-assignment.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { QueueNames } from '../../jobs/queues';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    AnalyticsModule,
    BullModule.registerQueue({ name: QueueNames.DISPUTE }),
  ],
  controllers: [DisputeController],
  providers: [
    DisputeService,
    DisputeAnalyticsService,
    AdminService,
    AdminAssignmentService,
  ],
  exports: [
    DisputeService,
    DisputeAnalyticsService,
    AdminService,
    AdminAssignmentService,
  ],
})
export class DisputeModule {}
