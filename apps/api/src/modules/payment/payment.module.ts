import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentSubscriptionController } from './payment-subscription.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentAdminController } from './payment-admin.controller';
import { PaymentService } from './payment.service';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { RazorpayService } from './gateways/razorpay.service';
import { StripeService } from './gateways/stripe.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MembershipModule } from '../membership/membership.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [AnalyticsModule, forwardRef(() => MembershipModule)],
  controllers: [PaymentController, PaymentSubscriptionController, PaymentWebhookController, PaymentAdminController],
  providers: [PaymentService, PaymentAnalyticsService, RazorpayService, StripeService, CompanyOwnerGuard],
  exports: [PaymentService, PaymentAnalyticsService, RazorpayService, StripeService],
})
export class PaymentModule {}
