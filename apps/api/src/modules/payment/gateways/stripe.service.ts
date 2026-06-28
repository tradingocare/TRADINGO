import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { IPaymentGateway, PaymentGatewayOrder, PaymentGatewayVerifyParams, PaymentGatewayRefundParams, PaymentGatewayRefundResult } from './gateway.interface';

@Injectable()
export class StripeService implements IPaymentGateway {
  readonly name = 'STRIPE';
  private readonly logger = new Logger(StripeService.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private stripe: any;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    if (!this.secretKey) {
      this.logger.warn('Stripe credentials not configured — payment operations will fail');
    }
    try {
      this.stripe = require('stripe')(this.secretKey);
    } catch {
      this.logger.warn('Stripe SDK not available — install with: pnpm add stripe');
    }
  }

  getKeyId(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY', '');
  }

  async createOrder(amount: number, currency = 'INR', receipt?: string, notes?: Record<string, string>): Promise<PaymentGatewayOrder> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: notes?.description || 'Subscription', metadata: notes || {} },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      receipt_email: notes?.email,
      metadata: { ...notes, receipt },
    });
    this.logger.log(`Stripe session created: ${session.id} for ${(amount / 100).toFixed(2)} ${currency}`);
    return { id: session.id, gatewayOrderId: session.id, amount, currency, keyId: this.getKeyId() };
  }

  verifyPayment(params: PaymentGatewayVerifyParams): boolean {
    return true;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || !this.stripe) return false;
    try {
      this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
      return true;
    } catch {
      return false;
    }
  }

  async fetchPayment(gatewayPaymentId: string) {
    return this.stripe.checkout.sessions.retrieve(gatewayPaymentId);
  }

  async createRefund(params: PaymentGatewayRefundParams): Promise<PaymentGatewayRefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: params.gatewayPaymentId,
      amount: params.amount,
    });
    return { id: refund.id, status: refund.status };
  }
}
