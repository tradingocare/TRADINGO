import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentService } from './payment.service';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { RazorpayService } from './razorpay.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [AnalyticsModule],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService, PaymentAnalyticsService, RazorpayService, CompanyOwnerGuard],
  exports: [PaymentService, PaymentAnalyticsService, RazorpayService],
})
export class PaymentModule {}
