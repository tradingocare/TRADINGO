import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionEngineService } from '../commission/commission-engine.service';
import { EscrowEventType, SettlementEventType } from '@prisma/client';
import { PayoutService } from '../payout/payout.service';

interface BookingFinancialStatus {
  bookingId: string;
  paymentStatus: string;
  bookingStatus: string;
  escrowId: string | null;
  escrowStatus: string | null;
  settlementId: string | null;
  settlementStatus: string | null;
  escrowAmount: number | null;
  escrowHeldAt: Date | null;
  escrowReleasedAt: Date | null;
  settledAt: Date | null;
}

@Injectable()
export class BookingFinancialOrchestratorService {
  private readonly logger = new Logger(BookingFinancialOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventEmitter2,
    private readonly commissionEngine: CommissionEngineService,
    private readonly payoutService: PayoutService,
  ) {}

  async processPaymentVerified(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        escrow: true,
        company: { select: { currentPlanId: true } },
        service: { select: { category: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.escrow) {
      this.logger.warn(`processPaymentVerified called twice for booking ${bookingId} — idempotent skip`);
      return;
    }

    const amountInPaise = Math.round(Number(booking.amount ?? 0) * 100);
    if (amountInPaise <= 0) {
      this.logger.warn(`Booking ${bookingId} has zero amount, skipping escrow hold`);
      return;
    }

    // Commission Engine — calculate before escrow hold
    const commissionResult = await this.commissionEngine.calculate(
      amountInPaise,
      booking.companyId,
      booking.service?.category ?? undefined,
      booking.company?.currentPlanId ?? undefined,
    ).catch((err) => {
      this.logger.warn(`Commission calculation failed for booking ${bookingId}: ${(err as Error).message}. Using zero commission.`);
      return null;
    });

    const commissionAmount = commissionResult?.platformCommission ?? 0;
    const commissionRuleId = commissionResult?.appliedRule?.id ?? null;
    const commissionMetadata = commissionResult ? {
      grossAmount: commissionResult.grossAmount,
      commissionType: commissionResult.commissionType,
      commissionValue: commissionResult.commissionValue,
      platformCommission: commissionResult.platformCommission,
      netSettlementAmount: commissionResult.netSettlementAmount,
      ruleSource: commissionResult.ruleSource,
      ruleId: commissionResult.appliedRule?.id ?? null,
      ruleName: commissionResult.appliedRule?.name ?? null,
      ruleType: commissionResult.appliedRule?.ruleType ?? null,
    } : null;

    const escrow = await this.prisma.$transaction(async (tx) => {
      const e = await tx.escrow.create({
        data: {
          bookingId,
          buyerCompanyId: booking.clientId,
          sellerCompanyId: booking.companyId,
          amount: amountInPaise,
          netAmount: amountInPaise,
          status: 'HELD',
          heldAt: new Date(),
          commissionAmount,
          commissionRuleId,
          commissionMetadata: commissionMetadata as any,
        },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId: e.id,
          type: EscrowEventType.ESCROW_HELD,
          createdById: userId,
          metadata: { bookingId, source: 'BOOKING_PAYMENT', commissionAmount },
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { escrowId: e.id },
      });

      return e;
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ESCROW_HELD',
        resource: 'booking_escrow',
        metadata: { bookingId, escrowId: escrow.id, amount: amountInPaise, commissionAmount, commissionRuleId, source: 'BOOKING_PAYMENT_VERIFIED' },
      },
    });

    this.eventBus.emit('booking.payment.captured', { bookingId, amount: amountInPaise, escrowId: escrow.id, commissionAmount });
    this.eventBus.emit('booking.escrow.held', { bookingId, escrowId: escrow.id, amount: amountInPaise, commissionAmount });

    this.logger.log(`Escrow ${escrow.id} held for booking ${bookingId} (₹${(amountInPaise / 100).toFixed(2)}, commission: ₹${(commissionAmount / 100).toFixed(2)})`);
  }

  async processBookingCompleted(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { escrow: { include: { settlements: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (!booking.escrow) {
      this.logger.warn(`No escrow found for booking ${bookingId}, skipping settlement`);
      return;
    }

    const escrow = booking.escrow;
    const existingSettlement = escrow.settlements.find(
      (s) => s.status === 'PENDING' || s.status === 'PROCESSING' || s.status === 'PROCESSED',
    );
    if (existingSettlement) {
      this.logger.warn(`processBookingCompleted called twice for booking ${bookingId} — idempotent skip`);
      return;
    }

    // Settlement amount = net escrow amount minus platform commission
    const commissionAmount = escrow.commissionAmount ?? 0;
    const settlementAmount = Math.max(0, escrow.netAmount - commissionAmount);

    let settlement: { id: string; status: string } | null = null;
    try {
      settlement = await this.prisma.$transaction(async (tx) => {
        const s = await tx.settlement.create({
          data: {
            escrowId: escrow.id,
            amount: settlementAmount,
            status: 'PENDING',
            createdById: userId,
          },
        });

        await tx.settlementEvent.create({
          data: {
            settlementId: s.id,
            type: 'SETTLEMENT_CREATED' as SettlementEventType,
            createdById: userId,
            metadata: { bookingId },
          },
        });

        return s;
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'SETTLEMENT_CREATED',
          resource: 'booking_settlement',
          metadata: { bookingId, escrowId: escrow.id, settlementId: settlement.id, amount: settlementAmount, commissionAmount },
        },
      });

      this.eventBus.emit('booking.settlement.created', {
        bookingId,
        escrowId: escrow.id,
        settlementId: settlement.id,
        amount: settlementAmount,
        commissionAmount,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.settlement.update({
          where: { id: settlement!.id },
          data: { status: 'PROCESSED', processedAt: new Date(), settledAt: new Date() },
        });

        await tx.settlementEvent.create({
          data: {
            settlementId: settlement!.id,
            type: 'SETTLEMENT_PROCESSED' as SettlementEventType,
            createdById: userId,
            metadata: { bookingId },
          },
        });
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'SETTLEMENT_PROCESSED',
          resource: 'booking_settlement',
          metadata: { bookingId, escrowId: escrow.id, settlementId: settlement.id },
        },
      });

      this.eventBus.emit('booking.settlement.completed', {
        bookingId,
        escrowId: escrow.id,
        settlementId: settlement.id,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.escrow.update({
          where: { id: escrow.id },
          data: { status: 'RELEASED', releasedAt: new Date() },
        });

        await tx.escrowEvent.create({
          data: {
            escrowId: escrow.id,
            type: EscrowEventType.ESCROW_RELEASED,
            createdById: userId,
            metadata: { bookingId, settlementId: settlement!.id },
          },
        });
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ESCROW_RELEASED',
          resource: 'booking_escrow',
          metadata: { bookingId, escrowId: escrow.id, settlementId: settlement.id },
        },
      });

      this.eventBus.emit('booking.escrow.released', { bookingId, escrowId: escrow.id, settlementId: settlement.id });

      // Create payout from settlement
      try {
        await this.payoutService.createFromSettlement(settlement.id, userId);
        this.logger.log(`Payout created from settlement ${settlement.id} for booking ${bookingId}`);
      } catch (err) {
        this.logger.warn(`Payout creation failed for settlement ${settlement.id}: ${(err as Error).message}`);
      }

      this.logger.log(`Booking ${bookingId} settled — escrow ${escrow.id} released, settlement ${settlement.id} processed`);
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Settlement failed for booking ${bookingId}: ${message}`);

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'SETTLEMENT_FAILED',
          resource: 'booking_settlement',
          metadata: { bookingId, escrowId: escrow.id, error: message },
        },
      }).catch((logErr) => this.logger.warn(`Failed to log SETTLEMENT_FAILED audit: ${(logErr as Error).message}`));

      if (settlement) {
        try {
          await this.prisma.settlement.update({
            where: { id: settlement.id },
            data: { status: 'FAILED', failedAt: new Date(), failedReason: message, retryCount: { increment: 1 } },
          });

          await this.prisma.settlementEvent.create({
            data: {
              settlementId: settlement.id,
              type: 'SETTLEMENT_FAILED' as SettlementEventType,
              metadata: { reason: message, bookingId },
              createdById: userId,
            },
          });
        } catch (settleErr) {
          this.logger.warn(`Failed to mark settlement ${settlement.id} as failed: ${(settleErr as Error).message}`);
        }
      }

      this.eventBus.emit('booking.settlement.failed', { bookingId, escrowId: escrow.id, error: message });

      throw err;
    }
  }

  async pauseSettlement(bookingId: string, userId: string, reason: string = 'Dispute opened'): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { escrow: { include: { settlements: { where: { status: { in: ['PENDING', 'PROCESSING'] } } } } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.escrow) {
      this.logger.warn(`No escrow for booking ${bookingId}, nothing to pause`);
      return;
    }

    const escrow = booking.escrow;
    if (escrow.status === 'FROZEN' || escrow.status === 'DISPUTED') {
      this.logger.warn(`Escrow ${escrow.id} already paused (${escrow.status})`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: 'FROZEN', frozenAt: new Date() },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          type: 'ESCROW_FROZEN' as EscrowEventType,
          createdById: userId,
          metadata: { bookingId, reason },
        },
      });

      // Pause any pending settlements
      for (const settlement of escrow.settlements) {
        await tx.settlement.update({
          where: { id: settlement.id },
          data: { status: 'PAUSED' },
        });
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SETTLEMENT_PAUSED',
        resource: 'booking_settlement',
        metadata: { bookingId, escrowId: escrow.id, reason },
      },
    });

    this.eventBus.emit('booking.settlement.paused', { bookingId, escrowId: escrow.id, reason });
    this.logger.log(`Settlement paused for booking ${bookingId} — escrow ${escrow.id} frozen`);
  }

  async resumeSettlement(bookingId: string, userId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { escrow: { include: { settlements: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.escrow) {
      this.logger.warn(`No escrow for booking ${bookingId}, nothing to resume`);
      return;
    }

    const escrow = booking.escrow;
    if (escrow.status !== 'FROZEN') {
      this.logger.warn(`Escrow ${escrow.id} is not frozen (${escrow.status}), nothing to resume`);
      return;
    }

    const previousStatus = escrow.status === 'FROZEN' ? 'HELD' : escrow.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: previousStatus, frozenAt: null },
      });

      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          type: EscrowEventType.ESCROW_REOPENED,
          createdById: userId,
          metadata: { bookingId, previousStatus: escrow.status, action: 'resume' },
        },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SETTLEMENT_RESUMED',
        resource: 'booking_settlement',
        metadata: { bookingId, escrowId: escrow.id },
      },
    });

    this.eventBus.emit('booking.settlement.resumed', { bookingId, escrowId: escrow.id });
    this.logger.log(`Settlement resumed for booking ${bookingId} — escrow ${escrow.id} unfrozen`);
  }

  @OnEvent('booking.payment.webhook.captured')
  async handleWebhookPaymentCaptured(payload: { bookingId: string; paymentId: string; companyId: string }): Promise<void> {
    this.logger.log(`Webhook payment captured for booking ${payload.bookingId}, calling processPaymentVerified`);
    try {
      await this.processPaymentVerified(payload.bookingId, payload.paymentId);
    } catch (err) {
      this.logger.error(`processPaymentVerified failed for booking ${payload.bookingId}: ${(err as Error).message}`);
    }
  }

  async getBookingFinancialStatus(bookingId: string): Promise<BookingFinancialStatus> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        escrow: {
          include: { settlements: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const escrow = booking.escrow;
    const settlement = escrow?.settlements?.[0] ?? null;

    return {
      bookingId: booking.id,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      escrowId: escrow?.id ?? null,
      escrowStatus: escrow?.status ?? null,
      settlementId: settlement?.id ?? null,
      settlementStatus: settlement?.status ?? null,
      escrowAmount: escrow?.amount ?? null,
      escrowHeldAt: escrow?.heldAt ?? null,
      escrowReleasedAt: escrow?.releasedAt ?? null,
      settledAt: settlement?.settledAt ?? null,
    };
  }
}
