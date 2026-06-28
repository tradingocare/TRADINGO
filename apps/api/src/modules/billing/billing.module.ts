import { Module, forwardRef } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingAdminController } from './billing-admin.controller';
import { BillingService } from './billing.service';
import { InvoiceService } from './invoice.service';
import { PdfService } from './pdf.service';
import { TaxService } from './tax.service';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [forwardRef(() => MembershipModule)],
  controllers: [BillingController, BillingAdminController],
  providers: [BillingService, InvoiceService, PdfService, TaxService],
  exports: [InvoiceService, TaxService],
})
export class BillingModule {}
