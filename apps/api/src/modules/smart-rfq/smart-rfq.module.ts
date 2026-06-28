import { Module } from '@nestjs/common';
import { RfqModule } from '../rfq/rfq.module';
import { SmartRfqController } from './smart-rfq.controller';
import { SmartRfqService } from './smart-rfq.service';
import { NearToFarService } from './near-to-far.service';
import { RfqSellerService } from './rfq-seller.service';
import { RfqAdminService } from './rfq-admin.service';

@Module({
  imports: [RfqModule],
  controllers: [SmartRfqController],
  providers: [SmartRfqService, NearToFarService, RfqSellerService, RfqAdminService],
  exports: [SmartRfqService],
})
export class SmartRfqModule {}
