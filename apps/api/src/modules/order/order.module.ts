import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderNumberService } from './order-number.service';
import { OrderTimelineService } from './order-timeline.service';
import { OrderDocumentService } from './order-document.service';
import { OrderAnalyticsService } from './order-analytics.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule, AnalyticsModule],
  controllers: [OrderController],
  providers: [OrderService, OrderNumberService, OrderTimelineService, OrderDocumentService, OrderAnalyticsService],
  exports: [OrderService, OrderAnalyticsService],
})
export class OrderModule {}
