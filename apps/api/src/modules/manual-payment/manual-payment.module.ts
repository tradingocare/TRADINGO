import { Module } from '@nestjs/common';
import { ManualPaymentController, AdminManualPaymentController } from './manual-payment.controller';
import { ManualPaymentService } from './manual-payment.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [ManualPaymentController, AdminManualPaymentController],
  providers: [ManualPaymentService, CompanyOwnerGuard],
  exports: [ManualPaymentService],
})
export class ManualPaymentModule {}
