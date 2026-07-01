import { Module } from '@nestjs/common';
import { AdvertisingController } from './advertising.controller';
import { AdminAdvertisingController } from './admin-advertising.controller';
import { AdvertisingService } from './advertising.service';
import { GocashModule } from '../gocash/gocash.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [GocashModule, MembershipModule],
  controllers: [AdvertisingController, AdminAdvertisingController],
  providers: [AdvertisingService],
  exports: [AdvertisingService],
})
export class AdvertisingModule {}
