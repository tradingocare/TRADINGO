import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { verifySignature } from '../utils/signature';
import { IPaymentGateway, PaymentGatewayOrder, PaymentGatewayVerifyParams, PaymentGatewayRefundParams, PaymentGatewayRefundResult } from './gateway.interface';

@Injectable()
export class RazorpayService implements IPaymentGateway {
  readonly name = 'RAZORPAY';
  private readonly logger = new Logger(RazorpayService.name);
  private client: Razorpay | null = null;

  constructor(private readonly configService: ConfigService) {
    const keyId = this.configService.get<string>('razorpay.keyId', '');
    const keySecret = this.configService.get<string>('razorpay.keySecret', '');
    const mode = this.configService.get<string>('razorpay.mode', 'test');
    if (keyId && mode === 'test' && keyId.startsWith('rzp_live')) {
      this.logger.warn('⚠ LIVE Razorpay key detected in TEST mode — no real charges will be processed');
    }
    if (keyId && mode === 'live' && keyId.startsWith('rzp_test')) {
      throw new Error('FATAL: TEST Razorpay key used in LIVE mode — refusing to start');
    }
    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('Razorpay credentials not configured — payment operations will fail');
    }
  }

  private ensureClient(): Razorpay {
    if (!this.client) {
      throw new Error('Razorpay client not initialized: missing keyId or keySecret configuration');
    }
    return this.client;
  }

  getKeyId(): string {
    return this.configService.get<string>('razorpay.keyId', '');
  }

  async createOrder(amount: number, currency = 'INR', receipt?: string, notes?: Record<string, string>): Promise<PaymentGatewayOrder> {
    const order = await this.ensureClient().orders.create({ amount, currency, receipt, notes });
    this.logger.log(`Razorpay order created: ${order.id} for ₹${(amount / 100).toFixed(2)}`);
    return { id: order.id, gatewayOrderId: order.id, amount: Number(order.amount), currency: order.currency, keyId: this.getKeyId() };
  }

  verifyPayment(params: PaymentGatewayVerifyParams): boolean {
    const payload = `${params.gatewayOrderId}|${params.gatewayPaymentId}`;
    return verifySignature(payload, params.gatewaySignature, this.configService.get<string>('razorpay.keySecret', ''));
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return verifySignature(rawBody, signature, this.configService.get<string>('razorpay.webhookSecret', ''));
  }

  async fetchPayment(gatewayPaymentId: string) {
    return this.ensureClient().payments.fetch(gatewayPaymentId);
  }

  async createRefund(params: PaymentGatewayRefundParams): Promise<PaymentGatewayRefundResult> {
    const refund = await this.ensureClient().payments.refund(params.gatewayPaymentId, { amount: params.amount, notes: params.notes });
    return { id: refund.id, status: refund.status };
  }
}
