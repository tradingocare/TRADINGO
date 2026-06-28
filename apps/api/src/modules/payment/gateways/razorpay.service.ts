import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { IPaymentGateway, PaymentGatewayOrder, PaymentGatewayVerifyParams, PaymentGatewayRefundParams, PaymentGatewayRefundResult } from './gateway.interface';

@Injectable()
export class RazorpayService implements IPaymentGateway {
  readonly name = 'RAZORPAY';
  private readonly logger = new Logger(RazorpayService.name);
  private readonly client: Razorpay;

  constructor(private readonly configService: ConfigService) {
    const keyId = this.configService.get<string>('razorpay.keyId', '');
    const keySecret = this.configService.get<string>('razorpay.keySecret', '');
    if (!keyId || !keySecret) {
      this.logger.warn('Razorpay credentials not configured — payment operations will fail');
    }
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  getKeyId(): string {
    return this.configService.get<string>('razorpay.keyId', '');
  }

  async createOrder(amount: number, currency = 'INR', receipt?: string, notes?: Record<string, string>): Promise<PaymentGatewayOrder> {
    const order = await this.client.orders.create({ amount, currency, receipt, notes });
    this.logger.log(`Razorpay order created: ${order.id} for ₹${(amount / 100).toFixed(2)}`);
    return { id: order.id, gatewayOrderId: order.id, amount: Number(order.amount), currency: order.currency, keyId: this.getKeyId() };
  }

  verifyPayment(params: PaymentGatewayVerifyParams): boolean {
    const expectedSignature = createHmac('sha256', this.configService.get<string>('razorpay.keySecret', ''))
      .update(`${params.gatewayOrderId}|${params.gatewayPaymentId}`)
      .digest('hex');
    return expectedSignature === params.gatewaySignature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expectedSignature = createHmac('sha256', this.configService.get<string>('razorpay.webhookSecret', ''))
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signature;
  }

  async fetchPayment(gatewayPaymentId: string) {
    return this.client.payments.fetch(gatewayPaymentId);
  }

  async createRefund(params: PaymentGatewayRefundParams): Promise<PaymentGatewayRefundResult> {
    const refund = await this.client.payments.refund(params.gatewayPaymentId, { amount: params.amount, notes: params.notes });
    return { id: refund.id, status: refund.status };
  }
}
