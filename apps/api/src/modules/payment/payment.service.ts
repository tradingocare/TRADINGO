import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from './gateways/razorpay.service';
import { StripeService } from './gateways/stripe.service';
import { getGateway } from './gateways/index';
import { MembershipService } from '../membership/membership.service';
import { CreatePaymentOrderDto, PaymentOrderType } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateSubscriptionOrderDto, VerifySubscriptionPaymentDto } from './dto/subscription-order.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { generateInvoiceNumber } from './utils/invoice';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
    private readonly membershipService: MembershipService,
    private readonly notificationService: NotificationService,
  ) {}

  async createPaymentOrder(companyId: string, dto: CreatePaymentOrderDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    if (dto.type === PaymentOrderType.ORDER) {
      if (!dto.orderId) throw new BadRequestException('orderId is required for ORDER_PAYMENT');
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (!order) throw new NotFoundException('Order not found');
    }

    if (dto.type === PaymentOrderType.CREDIT_PACK) {
      if (!dto.rfqCreditPackId) throw new BadRequestException('rfqCreditPackId is required for CREDIT_PACK_PURCHASE');
      const pack = await this.prisma.rfqCreditPack.findUnique({ where: { id: dto.rfqCreditPackId } });
      if (!pack) throw new NotFoundException('Credit pack not found');
    }

    const receipt = `rcpt_${companyId.slice(0, 8)}_${Date.now()}`;
    const razorpayOrder = await this.razorpayService.createOrder(
      dto.amount,
      dto.currency || 'INR',
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
        amount: dto.amount,
        currency: dto.currency || 'INR',
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
    if (!isValid) throw new BadRequestException('Payment verification failed — signature mismatch');

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
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    const amountInRupees = (payment.amount / 100).toFixed(2);

    await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: payment.companyId,
        paymentId: payment.id,
        subtotal: amountInRupees,
        totalAmount: amountInRupees,
        currency: payment.currency,
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

    const price = dto.planTier === 'B' ? plan.pricePlanB : dto.planTier === 'C' ? plan.pricePlanC : plan.pricePlanA;
    const totalAmount = price * dto.duration;
    const amountInPaise = totalAmount;
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
        amount: totalAmount,
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
      amount: totalAmount,
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
    const isValid = gateway.verifyPayment({
      gatewayOrderId: payment.gatewayOrderId!,
      gatewayPaymentId: dto.gatewayPaymentId,
      gatewaySignature: dto.gatewaySignature,
    });
    if (!isValid) throw new BadRequestException('Payment verification failed — signature mismatch');

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        gatewayPaymentId: dto.gatewayPaymentId,
        gatewaySignature: dto.gatewaySignature,
        paidAt: new Date(),
      },
    });

    const notes = (payment.notes as any) || {};
    const planId = notes.planId || 'trade_start';
    const planTier = notes.planTier || 'A';
    const duration = notes.duration || 1;

    await this.membershipService.activateSubscription({
      companyId,
      planId,
      planTier,
      amount: payment.amount,
      paymentId: payment.id,
      duration,
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
          }

          const count = await tx.invoice.count();
          const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
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
        });
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
        data: { eventId, gateway: 'RAZORPAY', payload },
      });
    }
  }
}
