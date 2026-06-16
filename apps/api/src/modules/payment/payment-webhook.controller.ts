import { Controller, Post, Headers, Req, RawBodyRequest, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProcessedWebhookEvent } from '@prisma/client';

@ApiTags('Payment Webhooks')
@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly razorpayService: RazorpayService,
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
      return { status: 'error', message: 'Invalid webhook signature' };
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { status: 'error', message: 'Invalid webhook payload' };
    }

    const eventId = payload.id;
    if (eventId) {
      const existing: ProcessedWebhookEvent | null = await this.prisma.processedWebhookEvent.findUnique({
        where: { eventId },
      });
      if (existing) {
        return { status: 'ok', message: 'Event already processed' };
      }
    }

    await this.paymentService.handleWebhookEvent(event || payload.event, payload);

    if (eventId) {
      await this.prisma.processedWebhookEvent.create({
        data: { eventId, gateway: 'RAZORPAY', payload },
      });
    }

    return { status: 'ok' };
  }
}
