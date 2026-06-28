import { IPaymentGateway } from './gateway.interface';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';

export type GatewayName = 'RAZORPAY' | 'STRIPE';

export function getGateway(name: string, razorpay: RazorpayService, stripe: StripeService): IPaymentGateway {
  switch (name) {
    case 'RAZORPAY': return razorpay;
    case 'STRIPE': return stripe;
    default: throw new Error(`Unsupported payment gateway: ${name}`);
  }
}

export { IPaymentGateway, PaymentGatewayOrder, PaymentGatewayVerifyParams, PaymentGatewayRefundParams, PaymentGatewayRefundResult } from './gateway.interface';
export { RazorpayService } from './razorpay.service';
export { StripeService } from './stripe.service';
