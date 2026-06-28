import { Module } from '@nestjs/common';
import { SmartPoController } from './smart-po.controller';
import { SmartPoService } from './smart-po.service';
import { PoPdfService } from './po-pdf.service';

@Module({
  controllers: [SmartPoController],
  providers: [SmartPoService, PoPdfService],
  exports: [SmartPoService],
})
export class SmartPoModule {}
