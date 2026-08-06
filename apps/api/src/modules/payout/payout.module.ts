import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommissionModule } from '../commission/commission.module';
import { PayoutService } from './payout.service';
import { PayoutAccountService } from './payout-account.service';
import { PayoutController } from './payout.controller';
import { PayoutAdminController } from './payout-admin.controller';

@Module({
  imports: [PrismaModule, CommissionModule],
  controllers: [PayoutController, PayoutAdminController],
  providers: [PayoutService, PayoutAccountService],
  exports: [PayoutService, PayoutAccountService],
})
export class PayoutModule {}
