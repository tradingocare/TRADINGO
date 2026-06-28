import { Module } from '@nestjs/common';
import { SmartDeliveryController } from './smart-delivery.controller';
import { SmartDeliveryService } from './smart-delivery.service';

@Module({
  controllers: [SmartDeliveryController],
  providers: [SmartDeliveryService],
  exports: [SmartDeliveryService],
})
export class SmartDeliveryModule {}
