import { Module } from '@nestjs/common';
import { SmartOrderController } from './smart-order.controller';
import { SmartOrderService } from './smart-order.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [SmartOrderController],
  providers: [SmartOrderService],
  exports: [SmartOrderService],
})
export class SmartOrderModule {}
