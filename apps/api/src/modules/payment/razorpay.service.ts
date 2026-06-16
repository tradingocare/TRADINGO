import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';

@Injectable()
export class RazorpayService {
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

  async createOrder(amount: number, currency = 'INR', receipt?: string, notes?: Record<string, string>) {
    const order = await this.client.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });
    this.logger.log(`Razorpay order created: ${order.id} for ₹${(amount / 100).toFixed(2)}`);
    return order;
  }

  verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean {
    const expectedSignature = createHmac('sha256', this.configService.get<string>('razorpay.keySecret', ''))
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    return expectedSignature === razorpaySignature;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = createHmac('sha256', this.configService.get<string>('razorpay.webhookSecret', ''))
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  async fetchPayment(paymentId: string) {
    return this.client.payments.fetch(paymentId);
  }

  async capturePayment(paymentId: string, amount: number, currency = 'INR') {
    return this.client.payments.capture(paymentId, amount, currency);
  }

  async createRefund(paymentId: string, amount: number, notes?: Record<string, string>) {
    return this.client.payments.refund(paymentId, {
      amount,
      notes,
    });
  }
}
