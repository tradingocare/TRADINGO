import { Module } from '@nestjs/common';
import { SmartShipmentController } from './smart-shipment.controller';
import { SmartShipmentService } from './smart-shipment.service';

@Module({
  controllers: [SmartShipmentController],
  providers: [SmartShipmentService],
  exports: [SmartShipmentService],
})
export class SmartShipmentModule {}
