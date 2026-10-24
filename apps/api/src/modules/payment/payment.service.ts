import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from './gateways/razorpay.service';
import { StripeService } from './gateways/stripe.service';
import { getGateway } from './gateways/index';
import { MembershipService } from '../membership/membership.service';
import { EscrowService } from '../escrow/escrow.service';
import { InvoiceService } from '../billing/invoice.service';
import { CreatePaymentOrderDto, PaymentOrderType } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateSubscriptionOrderDto, VerifySubscriptionPaymentDto } from './dto/subscription-order.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { getIndianFinancialYear, formatInvoiceNumber } from '../billing/utils/financial-year.util';
import { maskSensitiveData } from '../../common/utils/pii';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
    private readonly membershipService: MembershipService,
    private readonly escrowService: EscrowService,
    private readonly invoiceService: InvoiceService,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventEmitter2,
  ) {}

  async createPaymentOrder(companyId: string, dto: CreatePaymentOrderDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    // R3 — for ORDER payments the gateway amount is derived exclusively
    // from the persisted Order.totalAmount. The client-supplied `amount`
    // is accepted syntactically (contract compatibility) but never
    // determines the gateway charge. Other payment types keep their
    // existing authoritative sources.
    let gatewayAmount = dto.amount;
    let gatewayCurrency = dto.currency || 'INR';

    if (dto.type === PaymentOrderType.ORDER) {
      if (!dto.orderId) throw new BadRequestException('orderId is required for ORDER_PAYMENT');
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      // The caller must own the order as its buyer. Masked as NotFound so
      // the existence of foreign orders is never revealed.
      if (!order || order.deletedAt || order.buyerCompanyId !== companyId) {
        throw new NotFoundException('Order not found');
      }
      const existing = await this.prisma.payment.findFirst({
        where: { companyId, orderId: dto.orderId, status: 'PENDING' },
        include: { refunds: true, order: { select: { orderNumber: true } } },
      });
      if (existing) {
        this.logger.log(`Returning existing PENDING payment ${existing.id} for order ${dto.orderId}`);
        return { id: existing.id, gatewayOrderId: existing.gatewayOrderId, amount: existing.amount, currency: existing.currency, keyId: this.razorpayService.getKeyId() };
      }
      gatewayAmount = this.toOrderPaise(order);
      gatewayCurrency = order.currency || 'INR';
    }

    if (dto.type === PaymentOrderType.CREDIT_PACK) {
      if (!dto.rfqCreditPackId) throw new BadRequestException('rfqCreditPackId is required for CREDIT_PACK_PURCHASE');
      const pack = await this.prisma.rfqCreditPack.findUnique({ where: { id: dto.rfqCreditPackId } });
      if (!pack) throw new NotFoundException('Credit pack not found');
      const existing = await this.prisma.payment.findFirst({
        where: { companyId, rfqCreditPackId: dto.rfqCreditPackId, status: 'PENDING' },
        include: { refunds: true, order: { select: { orderNumber: true } } },
      });
      if (existing) {
        this.logger.log(`Returning existing PENDING payment ${existing.id} for credit pack ${dto.rfqCreditPackId}`);
        return { id: existing.id, gatewayOrderId: existing.gatewayOrderId, amount: existing.amount, currency: existing.currency, keyId: this.razorpayService.getKeyId() };
      }
    }

    const receipt = `rcpt_${companyId.slice(0, 8)}_${Date.now()}`;
    const razorpayOrder = await this.razorpayService.createOrder(
      gatewayAmount,
      gatewayCurrency,
      receipt,
      { companyId, type: dto.type },
    );

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: dto.type as any,
        gateway: 'RAZORPAY',
        status: 'PENDING',
        gatewayOrderId: razorpayOrder.id,
        amount: gatewayAmount,
        currency: gatewayCurrency,
        description: dto.description,
        orderId: dto.orderId,
        rfqCreditPackId: dto.rfqCreditPackId,
      },
    });

    return {
      id: payment.id,
      gatewayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(),
    };
  }

  /**
   * R3 — convert a persisted Order.totalAmount (rupees) to integer paise
   * using Decimal arithmetic. Rejects anything that cannot become an exact
   * paise integer: missing, non-finite, non-positive, and fractional-paise
   * values are never rounded silently.
   */
  private toOrderPaise(order: { totalAmount: Prisma.Decimal | string | number | null | undefined }): number {
    let total: Prisma.Decimal;
    try {
      if (order.totalAmount == null) throw new Error('missing total');
      total = new Prisma.Decimal(order.totalAmount);
    } catch {
      throw new BadRequestException('Order has an invalid total amount');
    }
    if (total.isNaN() || !total.isFinite() || total.lte(0)) {
      throw new BadRequestException('Order has an invalid total amount');
    }
    const paise = total.times(100);
    if (!paise.isInteger() || !Number.isSafeInteger(paise.toNumber())) {
      throw new BadRequestException('Order total cannot be represented as exact paise');
    }
    return paise.toNumber();
  }

  async verifyPayment(companyId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        companyId,
        gatewayOrderId: dto.razorpayOrderId,
        status: 'PENDING',
      },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const isValid = this.razorpayService.verifyPayment({
      gatewayOrderId: dto.razorpayOrderId,
      gatewayPaymentId: dto.razorpayPaymentId,
      gatewaySignature: dto.razorpaySignature,
    });
    if (!isValid) throw new BadRequestException('Payment verification failed â€” signature mismatch');

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        gatewayPaymentId: dto.razorpayPaymentId,
        gatewaySignature: dto.razorpaySignature,
        paidAt: new Date(),
      },
    });

    await this.handlePaymentSuccess(updated);

    const amountInRupees = (updated.amount / 100).toFixed(2);
    try {
      await this.notificationService.createWithTemplate(
        updated.companyId,
        undefined,
        NotificationType.PAYMENT_RECEIVED,
        { amount: amountInRupees },
      );
    } catch (err) {
      this.logger.error(`Failed to send PAYMENT_RECEIVED notification: ${(err as Error).message}`);
    }

    return updated;
  }

  private async handlePaymentSuccess(payment: any) {
    if (payment.type === 'ORDER_PAYMENT' && payment.orderId) {
      this.logger.log(`Payment ${payment.id} completed for order ${payment.orderId}`);
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      });
      try {
        await this.escrowService.hold(payment.orderId, payment.companyId, 'system-auto-escrow');
      } catch (err) {
        this.logger.error(`Auto-escrow failed for order ${payment.orderId}: ${(err as Error).message}`);
      }
      await this.generateInvoice(payment);
      return;
    }

    if (payment.type === 'SUBSCRIPTION') {
      const notes = (payment.notes as any) || {};
      await this.membershipService.activateSubscription({
        companyId: payment.companyId,
        planId: notes.planId || 'trade_start',
        planTier: notes.planTier || 'A',
        amount: payment.amount,
        paymentId: payment.id,
        duration: notes.duration || 1,
      });
      return;
    }

    if (payment.type === 'CREDIT_PACK_PURCHASE' && payment.rfqCreditPackId) {
      const pack = await this.prisma.rfqCreditPack.findUnique({ where: { id: payment.rfqCreditPackId } });
      if (pack) {
        await this.prisma.$transaction(async (tx) => {
          await tx.rfqCreditLedger.create({
            data: {
              companyId: payment.companyId,
              type: 'PURCHASE',
              amount: pack.credits,
              referenceId: payment.id,
              description: `Credit pack: ${pack.name} (${pack.credits} credits)`,
              packId: pack.id,
            },
          });
          await tx.rfqCreditPack.update({
            where: { id: pack.id },
            data: { isActive: true },
          });

          await tx.auditLog.create({
            data: {
              action: 'CREDIT_PACK_GRANTED',
              resource: `payment:${payment.id}`,
              metadata: { companyId: payment.companyId, packId: pack.id, credits: pack.credits, packName: pack.name },
            },
          });
        });
        this.logger.log(`Credits ${pack.credits} added to company ${payment.companyId} from pack ${pack.id}`);
      }
    }

    await this.generateInvoice(payment);
  }

  private async generateInvoice(payment: any) {
    // Canonical atomic invoice numbering: TRD/YY-YY/NNNNNN (GST Rule 46(b))
    const { startYear, fyLabel } = getIndianFinancialYear();
    const prefix = 'TRD';

    const seq = await this.prisma.invoiceSequence.upsert({
      where: { prefix_year: { prefix, year: startYear } },
      update: { lastSeq: { increment: 1 } },
      create: { prefix, year: startYear, lastSeq: 1 },
    });

    const invoiceNumber = formatInvoiceNumber(prefix, fyLabel, seq.lastSeq);
    const amountInRupees = (payment.amount / 100).toFixed(2);

    // Fetch buyer company details including GSTIN
    const company = payment.companyId
      ? await this.prisma.company.findUnique({
          where: { id: payment.companyId },
          select: { gstNumber: true },
        })
      : null;

    await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: payment.companyId,
        paymentId: payment.id,
        subtotal: amountInRupees,
        totalAmount: amountInRupees,
        currency: payment.currency,
        gstNumber: company?.gstNumber || null,
        status: 'GENERATED',
        paidAt: payment.paidAt || new Date(),
      },
    });
  }

  async findAll(companyId: string, limit = 20, cursor?: string) {
    const where: any = { companyId };
    if (cursor) {
      where.id = { lt: cursor };
    }
    const data = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { refunds: true, order: { select: { orderNumber: true } } },
    });
    const total = await this.prisma.payment.count({ where: { companyId } });
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }

  async findOne(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId },
      include: { refunds: true, order: { select: { orderNumber: true } }, rfqCreditPack: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async retryPaymentOrder(companyId: string, paymentId: string) {
    const existing = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
    });
    if (!existing) throw new NotFoundException('Payment not found');
    if (existing.status !== 'FAILED') throw new BadRequestException('Only FAILED payments can be retried');

    const targetGateway = (existing.gateway || 'RAZORPAY') as string;
    const gateway = getGateway(targetGateway, this.razorpayService, this.stripeService);

    const receipt = `retry_${companyId.slice(0, 8)}_${Date.now()}`;
    const gatewayOrder = await gateway.createOrder(
      existing.amount,
      existing.currency || 'INR',
      receipt,
      { companyId, retryOf: paymentId },
    );

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: existing.type,
        gateway: targetGateway as any,
        status: 'PENDING',
        gatewayOrderId: gatewayOrder.gatewayOrderId || gatewayOrder.id,
        amount: existing.amount,
        currency: existing.currency,
        description: existing.description,
        orderId: existing.orderId,
        rfqCreditPackId: existing.rfqCreditPackId,
        notes: { retryOf: paymentId },
      },
    });

    return {
      id: payment.id,
      gatewayOrderId: gatewayOrder.gatewayOrderId || gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      keyId: gateway.getKeyId(),
    };
  }

  async createRefund(companyId: string, paymentId: string, dto: CreateRefundDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'CAPTURED') throw new BadRequestException('Only captured payments can be refunded');

    const totalRefunded = await this.prisma.refund.aggregate({
      where: { paymentId },
      _sum: { amount: true },
    });
    const alreadyRefunded = totalRefunded._sum.amount || 0;
    if (alreadyRefunded + dto.amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds the remaining capturable amount');
    }

    const razorpayRefund = await this.razorpayService.createRefund({
      gatewayPaymentId: payment.gatewayPaymentId!,
      amount: dto.amount,
      notes: { reason: dto.reason || 'Customer requested' },
    });

    const refund = await this.prisma.$transaction(async (tx) => {
      const r = await tx.refund.create({
        data: {
          paymentId,
          gatewayRefundId: razorpayRefund.id,
          amount: dto.amount,
          reason: dto.reason,
          status: 'PROCESSING',
          orderReturnId: dto.orderReturnId,
        },
      });

      const newTotalRefunded = alreadyRefunded + dto.amount;
      if (newTotalRefunded >= payment.amount) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'REFUNDED' },
        });
      } else {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'PARTIALLY_REFUNDED' },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'REFUND_CREATED',
          resource: `payment:${paymentId}`,
          metadata: { refundId: r.id, amount: dto.amount, reason: dto.reason },
        },
      });

      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: newTotalRefunded >= payment.amount ? 'RETURNED' : 'CANCELLED' },
        });
        const escrow = await tx.escrow.findUnique({ where: { orderId: payment.orderId } });
        if (escrow && escrow.status !== 'REFUNDED') {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'REFUNDED', refundedAt: new Date() },
          });
        }
      }

      return r;
    });

    const amountInRupees = (dto.amount / 100).toFixed(2);
    try {
      await this.notificationService.createWithTemplate(
        payment.companyId,
        undefined,
        NotificationType.PAYMENT_REFUNDED,
        { amount: amountInRupees },
      );
    } catch (err) {
      this.logger.error(`Failed to send PAYMENT_REFUNDED notification: ${(err as Error).message}`);
    }

    return refund;
  }

  async createSubscriptionGatewayOrder(companyId: string, userId: string, dto: CreateSubscriptionOrderDto, gatewayName: string) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // P0-2 remediation: fail fast — never create a gateway order for a plan that
    // could not activate. Previously an unmappable plan produced a capturable order
    // whose verification then failed after the money was taken.
    // Free plans (₹0) are NOT payable here either: they must use the free activation
    // path (POST /membership/activate-free), never a gateway order (Razorpay rejects
    // zero-amount orders).
    if (plan.isFree) {
      throw new BadRequestException('Free plans are activated directly — no payment order is required');
    }

    const existingPending = await this.prisma.payment.findFirst({
      where: { companyId, type: 'SUBSCRIPTION', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (existingPending) {
      const gateway = getGateway(gatewayName, this.razorpayService, this.stripeService);
      return {
        id: existingPending.id,
        gatewayOrderId: existingPending.gatewayOrderId,
        amount: existingPending.amount,
        currency: existingPending.currency,
        keyId: gateway.getKeyId(),
        message: 'Existing pending subscription order found',
      };
    }

    const price = dto.planTier === 'B' ? plan.pricePlanB : dto.planTier === 'C' ? plan.pricePlanC : plan.pricePlanA;
    const totalAmount = price * dto.duration;

    // P0-5 remediation — Money unit contract:
    //   MembershipPlan.pricePlanA/B/C are stored in INR RUPEES (₹6,000 – ₹1,50,000).
    //   Razorpay's Orders API expects INTEGER PAISE. Payment.amount is the canonical
    //   paise field (the booking-payment path and every downstream consumer — invoice,
    //   notifications, revenue summary, payout, refund, finance aggregator — divide
    //   it by 100 to render rupees). This was previously `amountInPaise = totalAmount`
    //   (rupees passed straight to the gateway => 100x undercharge), and
    //   `amount: totalAmount` stored rupees in the canonical paise field.
    //   Exactly ONE deliberate conversion rupees -> paise happens here.
    const amountInPaise = Math.round(totalAmount * 100);
    const receipt = `sub_${companyId.slice(0, 8)}_${Date.now()}`;

    const gateway = getGateway(gatewayName, this.razorpayService, this.stripeService);
    const gatewayOrder = await gateway.createOrder(amountInPaise, 'INR', receipt, {
      companyId,
      planId: dto.planId,
      planTier: dto.planTier,
      duration: String(dto.duration),
      description: `Subscription: ${plan.name} (${dto.planTier})`,
    });

    const orderId = `ORD-${uuid().slice(0, 8).toUpperCase()}`;
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: 'SUBSCRIPTION',
        gateway: gatewayName as any,
        status: 'PENDING',
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        description: `Subscription: ${plan.name} (${dto.planTier})`,
        notes: {
          orderId,
          planId: dto.planId,
          planTier: dto.planTier,
          duration: dto.duration,
          userId,
        },
      },
    });

    return {
      id: payment.id,
      orderId,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: gateway.getKeyId(),
      planName: plan.name,
    };
  }

  async verifySubscriptionPayment(companyId: string, dto: VerifySubscriptionPaymentDto, gatewayName: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, companyId, status: 'PENDING' },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const gateway = getGateway(gatewayName, this.razorpayService, this.stripeService);
    const isValid = await gateway.verifyPayment({
      gatewayOrderId: payment.gatewayOrderId!,
      gatewayPaymentId: dto.gatewayPaymentId,
      gatewaySignature: dto.gatewaySignature,
    });
    if (!isValid) throw new BadRequestException('Payment verification failed — signature mismatch');

    const notes = (payment.notes as any) || {};
    const planId = notes.planId || 'trade_start';
    const planTier = notes.planTier || 'A';
    const duration = notes.duration || 1;

    // P0-2 remediation — ATOMICITY:
    // Previously the payment was flipped to CAPTURED and committed FIRST, and the
    // plan-mapping/activation ran afterwards untransacted. When activation threw
    // (e.g. toPlanType on launch plans), the money stayed captured with NO
    // subscription and NO invoice — and because this path only accepts PENDING
    // payments, the webhook could never recover it (it skips non-PENDING rows).
    //
    // Now: plan resolution + capture + activation + invoice commit in ONE
    // prisma.$transaction. Any failure (including an unmappable plan) rolls back
    // the CAPTURED update too — the payment remains PENDING, so:
    //   - the Razorpay checkout can be re-verified idempotently, or
    //   - the webhook (which processes PENDING rows) retries activation, or
    //   - support can refund a never-activated charge via the existing refund path.
    // The gateway charge itself cannot be rolled back by a DB transaction, but a
    // PENDING local row means no double activation can occur and every retry path
    // remains open. External-gateway compensation (auto-refund on local failure)
    // is deliberately NOT invented in this wave.
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          gatewayPaymentId: dto.gatewayPaymentId,
          gatewaySignature: dto.gatewaySignature,
          paidAt: new Date(),
        },
      });

      await this.membershipService.activateSubscription(
        {
          companyId,
          planId,
          planTier,
          amount: payment.amount,
          paymentId: payment.id,
          duration,
        },
        tx,
      );
    });

    try {
      await this.notificationService.createWithTemplate(
        companyId, undefined, NotificationType.PAYMENT_RECEIVED as any,
        { amount: (payment.amount / 100).toFixed(2), plan: planId },
      );
    } catch (err) {
      this.logger.error(`Failed to send payment notification: ${(err as Error).message}`);
    }

    return { success: true, paymentId: payment.id, planId, planTier, amount: payment.amount };
  }

  async handleWebhookEvent(event: string, payload: any) {
    const eventId = payload.id;
    if (eventId) {
      const processed = await this.prisma.processedWebhookEvent.findUnique({ where: { eventId } });
      if (processed) {
        this.logger.log(`Skipping already processed webhook event: ${eventId}`);
        return;
      }
    }

    this.logger.log(`Webhook event received: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment?.entity || payload.entity;
      if (!paymentEntity) return;

      const existing = await this.prisma.payment.findFirst({
        where: { gatewayPaymentId: paymentEntity.id },
      });
      if (existing) return;

      const pendingPayment = await this.prisma.payment.findFirst({
        where: { gatewayOrderId: paymentEntity.order_id, status: 'PENDING' },
      });
      if (pendingPayment) {
        const updatedPayment = { ...pendingPayment, gatewayPaymentId: paymentEntity.id };
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: pendingPayment.id },
            data: {
              status: 'CAPTURED',
              gatewayPaymentId: paymentEntity.id,
              paidAt: new Date(),
            },
          });

          if (updatedPayment.type === 'CREDIT_PACK_PURCHASE' && updatedPayment.rfqCreditPackId) {
            const pack = await tx.rfqCreditPack.findUnique({ where: { id: updatedPayment.rfqCreditPackId } });
            if (pack) {
              await tx.rfqCreditLedger.create({
                data: {
                  companyId: updatedPayment.companyId,
                  type: 'PURCHASE',
                  amount: pack.credits,
                  referenceId: updatedPayment.id,
                  description: `Credit pack: ${pack.name} (${pack.credits} credits)`,
                  packId: pack.id,
                },
              });
              await tx.rfqCreditPack.update({
                where: { id: pack.id },
                data: { isActive: true },
              });
              this.logger.log(`Credits ${pack.credits} added to company ${updatedPayment.companyId} from pack ${pack.id}`);
            }
          } else if (updatedPayment.type === 'SUBSCRIPTION') {
            const notes = updatedPayment.notes as { planId?: string; planTier?: string; duration?: string } | null;
            if (notes?.planId) {
              // P0-2 remediation: activation now runs INSIDE this webhook transaction
              // (threaded tx client) and its failure is NO LONGER swallowed — the
              // transaction aborts, the CAPTURED update rolls back, and the payment
              // stays PENDING so this webhook (or the verify path) can retry safely.
              // Previously the error was logged and swallowed, permanently stranding
              // a captured payment with no subscription.
              // P0-7 remediation: the legacy INV- invoice block that previously sat
              // after this branch was replaced with the canonical InvoiceSequence
              // numbering (see the P0-7 block below).
              await this.membershipService.activateSubscription(
                {
                  companyId: updatedPayment.companyId,
                  planId: notes.planId,
                  planTier: notes.planTier || 'A',
                  amount: updatedPayment.amount,
                  paymentId: updatedPayment.id,
                  duration: notes.duration ? Number(notes.duration) : undefined,
                },
                tx,
              );
              this.logger.log(`Subscription activated via webhook for company ${updatedPayment.companyId}`);
            }
          } else if (updatedPayment.type === 'BOOKING_PAYMENT') {
            const notes = updatedPayment.notes as { bookingId?: string } | null;
            const bookingId = notes?.bookingId;
            if (bookingId) {
              try {
                await tx.booking.update({
                  where: { id: bookingId },
                  data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
                });
                this.logger.log(`Booking ${bookingId} confirmed via webhook for payment ${updatedPayment.id}`);
              } catch (err) {
                this.logger.warn(`Failed to update booking ${bookingId} via webhook: ${(err as Error).message}`);
              }
            }
          }

          // P0-7 remediation — canonical atomic invoice numbering:
          // The legacy INV-YYYYMMDD-NNNN number was built from tx.invoice.count()+1 —
          // a non-atomic read-modify-write. Under concurrent webhook deliveries two
          // transactions computed the same number and the invoiceNumber @unique
          // constraint threw INSIDE this transaction, rolling back the CAPTURED
          // update (paid webhook left PENDING). It also collided with the canonical
          // TRD invoice already created by activateSubscription for SUBSCRIPTION
          // payments (Invoice.paymentId @unique). Now the invoice number comes from
          // the existing canonical InvoiceSequence (single-row atomic
          // UPDATE lastSeq = lastSeq + 1) via InvoiceService.generateInvoiceNumber
          // on the SAME transaction client — same TRD/YY-YY/NNNNNN statutory format,
          // same atomic unit as capture. SUBSCRIPTION payments already receive their
          // full statutory invoice from activateSubscription inside this same
          // transaction (reads via tx see those uncommitted writes), so they are
          // skipped here — exactly one invoice per payment.
          const existingInvoice = await tx.invoice.findUnique({
            where: { paymentId: updatedPayment.id },
            select: { id: true },
          });
          if (!existingInvoice) {
            const invoiceNumber = await this.invoiceService.generateInvoiceNumber(tx);
            const amountInRupees = (updatedPayment.amount / 100).toFixed(2);
            await tx.invoice.create({
              data: {
                invoiceNumber,
                companyId: updatedPayment.companyId,
                paymentId: updatedPayment.id,
                subtotal: amountInRupees,
                totalAmount: amountInRupees,
                currency: updatedPayment.currency,
                status: 'GENERATED',
                paidAt: new Date(),
              },
            });
          }
        });

        // Emit event for booking payment webhook capture â€” orchestrator listens to create escrow
        if (pendingPayment?.type === 'BOOKING_PAYMENT') {
          const notes = pendingPayment.notes as Record<string, unknown> | null;
          const bookingId = notes?.bookingId;
          if (bookingId) {
            this.eventBus.emit('booking.payment.webhook.captured', {
              bookingId,
              paymentId: pendingPayment.id,
              companyId: pendingPayment.companyId,
            });
          }
        }
      }
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity || payload.entity;
      if (!paymentEntity) return;

      const failedPayment = await this.prisma.payment.findFirst({
        where: { gatewayOrderId: paymentEntity.order_id, status: 'PENDING' },
        select: { companyId: true, amount: true },
      });

      await this.prisma.payment.updateMany({
        where: { gatewayOrderId: paymentEntity.order_id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });

      if (failedPayment) {
        const amountInRupees = (failedPayment.amount / 100).toFixed(2);
        const reason = paymentEntity.error?.description || paymentEntity.error_description || 'Payment failed';
        try {
          await this.notificationService.createWithTemplate(
            failedPayment.companyId,
            undefined,
            NotificationType.PAYMENT_FAILED,
            { amount: amountInRupees, reason },
          );
        } catch (err) {
          this.logger.error(`Failed to send PAYMENT_FAILED notification: ${(err as Error).message}`);
        }
      }
    }

    if (event === 'refund.created') {
      const refundEntity = payload.refund?.entity || payload.entity;
      if (!refundEntity) return;

      await this.prisma.refund.updateMany({
        where: { gatewayRefundId: refundEntity.id },
        data: { status: 'COMPLETED' },
      });
    }

    if (eventId) {
      await this.prisma.processedWebhookEvent.create({
        data: { eventId, gateway: 'RAZORPAY', payload: maskSensitiveData(payload) as any },
      });
    }
  }
}
