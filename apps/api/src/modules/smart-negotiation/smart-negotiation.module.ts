import { Module } from '@nestjs/common';
import { SmartNegotiationController } from './smart-negotiation.controller';
import { SmartNegotiationService } from './smart-negotiation.service';

@Module({
  controllers: [SmartNegotiationController],
  providers: [SmartNegotiationService],
  exports: [SmartNegotiationService],
})
export class SmartNegotiationModule {}
