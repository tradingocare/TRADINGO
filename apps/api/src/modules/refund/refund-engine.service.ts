import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../payment/gateways/razorpay.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { BookingRefundResult } from './dto/refund-engine.dto';

@Injectable()
export class RefundEngineService {
  private readonly logger = new Logger(RefundEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventEmitter2,
  ) {}

  async processBookingRefund(
    bookingId: string,
    userId: string,
    amount?: number,
    reason?: string,
    refundType: string = 'FULL',
  ): Promise<BookingRefundResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        escrow: true,
        company: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    this.validateRefundEligibility(booking);

    // Payment record is referenced via booking.paymentId (no Prisma relation, just stored ID)
    const payment = booking.paymentId
      ? await this.prisma.payment.findUnique({ where: { id: booking.paymentId } })
      : null;

    const escrow = booking.escrow;

    // Calculate refund amount (paise)
    const bookingAmount = Math.round(Number(booking.amount ?? 0) * 100);
    const refundAmount = amount ?? bookingAmount;

    if (refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }
    if (refundAmount > bookingAmount) {
      throw new BadRequestException('Refund amount cannot exceed booking amount');
    }

    const isFullRefund = refundAmount >= bookingAmount;
    let refundId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      // 1. Process gateway refund if payment exists
      if (payment?.gatewayPaymentId) {
        const razorpayRefund = await this.razorpayService.createRefund({
          gatewayPaymentId: payment.gatewayPaymentId,
          amount: refundAmount,
          notes: { reason: reason || 'Booking refund', bookingId, refundType },
        });

        const rf = await tx.refund.create({
          data: {
            paymentId: payment.id,
            gatewayRefundId: razorpayRefund.id,
            amount: refundAmount,
            reason: reason || null,
            status: 'PROCESSING',
          },
        });
        refundId = rf.id;

        // Update payment status
        await tx.refund.aggregate({
          where: { paymentId: payment.id },
          _sum: { amount: true },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
        });
      }

      // 2. Handle escrow — only full refunds transition to REFUNDED
      if (escrow && escrow.status !== 'REFUNDED') {
        if (isFullRefund) {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'REFUNDED', refundedAt: new Date() },
          });
        } else {
          await tx.escrow.update({
            where: { id: escrow.id },
            data: { status: 'PARTIALLY_RELEASED' },
          });
        }
      }

      // 3. Update booking
      const newBookingPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      const updateData: any = { paymentStatus: newBookingPaymentStatus };
      if (refundType === 'CANCELLATION' || isFullRefund) {
        updateData.status = 'CANCELLED';
        updateData.cancelledAt = new Date();
        updateData.cancelReason = reason || 'Refunded';
      }
      await tx.booking.update({ where: { id: bookingId }, data: updateData });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'BOOKING_REFUNDED',
          resource: 'booking_refund',
          metadata: {
            bookingId,
            refundId,
            amount: refundAmount,
            refundType,
            reason: reason || null,
            escrowStatus: escrow ? (isFullRefund ? 'REFUNDED' : 'PARTIALLY_RELEASED') : null,
          },
        },
      });
    });

    // Events + notifications
    this.eventBus.emit('booking.refund.processed', { bookingId, refundId, amount: refundAmount, refundType, reason });

    await this.sendRefundNotifications(booking, refundAmount, reason, refundType).catch(
      (err) => this.logger.warn(`Refund notification failed: ${(err as Error).message}`),
    );

    this.logger.log(`Booking ${bookingId} refunded: ₹${(refundAmount / 100).toFixed(2)} (${refundType})`);

    return {
      success: true,
      refundId,
      bookingId,
      amount: refundAmount,
      refundType,
      paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      escrowStatus: escrow ? (isFullRefund ? 'REFUNDED' : 'PARTIALLY_RELEASED') : 'NONE',
      bookingStatus: (refundType === 'CANCELLATION' || isFullRefund) ? 'CANCELLED' : booking.status,
    };
  }

  private validateRefundEligibility(booking: { status: string; paymentStatus: string; amount: unknown }): void {
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'CAPTURED') {
      throw new BadRequestException(`Booking payment status is ${booking.paymentStatus}, cannot refund`);
    }
    if (Number(booking.amount ?? 0) <= 0) {
      throw new BadRequestException('Booking amount is zero, nothing to refund');
    }
  }

  private async sendRefundNotifications(
    booking: { id: string; companyId: string; clientId: string },
    amount: number,
    reason: string | undefined,
    refundType: string,
  ): Promise<void> {
    const amountInRupees = (amount / 100).toFixed(2);

    await this.notificationService.createWithTemplate(
      booking.clientId,
      undefined,
      NotificationType.PAYMENT_REFUNDED,
      { amount: amountInRupees, reason: reason || refundType, bookingId: booking.id },
    );
    await this.notificationService.createWithTemplate(
      booking.companyId,
      undefined,
      NotificationType.REFUND_REQUESTED,
      { amount: amountInRupees, reason: reason || refundType, bookingId: booking.id },
    );
  }
}
