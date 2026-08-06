import { Controller, Post, Headers, Req, RawBodyRequest, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { RazorpayService } from './gateways/razorpay.service';
import { StripeService } from './gateways/stripe.service';
import { PrismaService } from '../../prisma/prisma.service';
import { maskSensitiveData } from '../../common/utils/pii';

@ApiTags('Payment Webhooks')
@Throttle({ default: { limit: 60, ttl: 60000 } })
@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-razorpay-event') event: string,
  ) {
    const rawBody = req.rawBody?.toString() || '';
    if (!signature || !this.razorpayService.verifyWebhookSignature(rawBody, signature)) {
      throw new HttpException({ status: 'error', message: 'Invalid webhook signature' }, HttpStatus.UNAUTHORIZED);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new HttpException({ status: 'error', message: 'Invalid webhook payload' }, HttpStatus.BAD_REQUEST);
    }

    const eventId = payload.id;
    if (eventId) {
      const existing = await this.prisma.processedWebhookEvent.findUnique({ where: { eventId } });
      if (existing) return { status: 'ok', message: 'Event already processed' };
    }

    await this.paymentService.handleWebhookEvent(event || payload.event, payload);

    if (eventId) {
      await this.prisma.processedWebhookEvent.create({
        data: { eventId, gateway: 'RAZORPAY', payload: maskSensitiveData(payload) as any },
      });
    }

    return { status: 'ok' };
  }

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() || '';
    if (!signature || !this.stripeService.verifyWebhookSignature(rawBody, signature)) {
      throw new HttpException({ status: 'error', message: 'Invalid webhook signature' }, HttpStatus.UNAUTHORIZED);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new HttpException({ status: 'error', message: 'Invalid webhook payload' }, HttpStatus.BAD_REQUEST);
    }

    const eventId = payload.id;
    if (eventId) {
      const existing = await this.prisma.processedWebhookEvent.findUnique({ where: { eventId } });
      if (existing) return { status: 'ok', message: 'Event already processed' };
    }

    const eventType = payload.type || '';
    await this.paymentService.handleWebhookEvent(eventType, payload);

    if (eventId) {
      await this.prisma.processedWebhookEvent.create({
        data: { eventId, gateway: 'STRIPE', payload: maskSensitiveData(payload) as any },
      });
    }

    return { status: 'ok' };
  }
}
