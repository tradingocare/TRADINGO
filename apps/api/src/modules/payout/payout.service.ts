import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CommissionService } from '../commission/commission.service';
import { QueryPayoutDto } from './dto/payout.dto';
import Razorpay from 'razorpay';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private readonly razorpay: Razorpay | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly commissionService: CommissionService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId', '');
    const keySecret = this.configService.get<string>('razorpay.keySecret', '');
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createFromSettlement(settlementId: string, userId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { escrow: { include: { order: true } } },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (settlement.status !== 'PROCESSED') throw new BadRequestException('Settlement must be PROCESSED');

    const existing = await this.prisma.payout.findFirst({ where: { settlementId } });
    if (existing) throw new BadRequestException('Payout already exists for this settlement');

    const escrow = settlement.escrow;
    const amount = settlement.amount;

    // Prefer commission stored on escrow (booking flow) over recalculating
    let commissionAmount = escrow.commissionAmount ?? 0;
    let tdsAmount = 0;
    let gstAmount = 0;
    let netAmount = amount - commissionAmount;

    if (escrow.commissionAmount === 0 || escrow.commissionAmount === null) {
      // Order flow: escrow may not have commission stored — calculate fresh
      const commission = await this.commissionService.calculate(amount, undefined);
      commissionAmount = commission.commissionAmount;
      tdsAmount = commission.tdsAmount;
      gstAmount = commission.gstAmount;
      netAmount = commission.netAmount;
    }

    const account = await this.prisma.sellerPayoutAccount.findUnique({
      where: { companyId: escrow.sellerCompanyId },
    });

    const payout = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          companyId: escrow.sellerCompanyId,
          gateway: 'RAZORPAY' as any,
          amount,
          commissionAmount,
          tdsAmount,
          gstAmount,
          netAmount,
          status: 'PENDING',
          type: 'SETTLEMENT',
          settlementId,
          bankAccount: account?.bankAccount ?? null,
          ifscCode: account?.ifscCode ?? null,
          fundAccountId: account?.fundAccountId ?? null,
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          type: 'SETTLEMENT_PROCESSED' as any,
          metadata: { payoutId: p.id, commissionAmount, netAmount },
          createdById: userId,
        },
      });

      return p;
    });

    this.logger.log(`Payout ${payout.id} created for settlement ${settlementId}, net ₹${(netAmount / 100).toFixed(2)}`);
    return payout;
  }

  async processPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { company: { select: { name: true } }, settlement: { include: { escrow: true } } },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'PENDING') throw new BadRequestException('Payout must be PENDING');

    if (!this.razorpay || !payout.fundAccountId) {
      this.logger.warn(`No Razorpay client or fund account for payout ${payoutId} — marking as manual`);
      return this.markManual(payoutId);
    }

    try {
      const response: any = await (this.razorpay as any).api.post({
        url: '/v1/payouts',
        data: {
          account_number: this.configService.get<string>('razorpay.accountNumber', ''),
          fund_account_id: payout.fundAccountId,
          amount: payout.netAmount ?? payout.amount,
          currency: 'INR',
          mode: 'NEFT',
          purpose: 'payout',
          queue_if_low_balance: true,
          reference_id: `TRD-PO-${payout.id.slice(0, 8)}`,
          narration: `Payout for order settlement — ${payout.company.name}`,
        },
      });

      const updated = await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'PROCESSING',
          gatewayPayoutId: response.id,
        },
      });

      await this.prisma.auditLog.create({
        data: { action: 'PAYOUT_PROCESSING', resource: `payout:${payoutId}`, metadata: { gatewayPayoutId: response.id, amount: payout.amount } },
      });

      this.logger.log(`Payout ${payoutId} submitted to Razorpay: ${response.id}`);
      return updated;
    } catch (err) {
      this.logger.error(`Razorpay payout failed for ${payoutId}: ${(err as Error).message}`);
      return this.markManual(payoutId);
    }
  }

  private async markManual(payoutId: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PENDING', type: 'MANUAL' },
    });
  }

  async confirmPayout(payoutId: string, gatewayPayoutId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId }, include: { settlement: { include: { escrow: true } } } });
    if (!payout) throw new NotFoundException('Payout not found');

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        gatewayPayoutId,
      },
    });

    await this.prisma.auditLog.create({
      data: { action: 'PAYOUT_COMPLETED', resource: `payout:${payoutId}`, metadata: { gatewayPayoutId, amount: payout.amount, netAmount: payout.netAmount } },
    });

    try {
      await this.notificationService.createWithTemplate(
        payout.companyId,
        undefined,
        'PAYOUT_PROCESSED' as any,
        { amount: (payout.amount / 100).toFixed(2), netAmount: (payout.netAmount ?? payout.amount / 100).toFixed(2) },
      );
    } catch (err) {
      this.logger.warn(`Failed to send PAYOUT_PROCESSED: ${(err as Error).message}`);
    }

    return updated;
  }

  async failPayout(payoutId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'FAILED' },
    });

    await this.prisma.auditLog.create({
      data: { action: 'PAYOUT_FAILED', resource: `payout:${payoutId}`, metadata: { reason, amount: payout.amount } },
    });

    try {
      await this.notificationService.createWithTemplate(
        payout.companyId,
        undefined,
        'PAYOUT_FAILED' as any,
        { amount: (payout.amount / 100).toFixed(2), reason },
      );
    } catch (err) {
      this.logger.warn(`Failed to send PAYOUT_FAILED: ${(err as Error).message}`);
    }

    return updated;
  }

  async getPayout(payoutId: string, companyId?: string) {
    const where: any = { id: payoutId };
    if (companyId) where.companyId = companyId;

    const payout = await this.prisma.payout.findFirst({
      where,
      include: { settlement: { include: { escrow: { include: { order: { select: { orderNumber: true } } } } } } },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    return payout;
  }

  async listPayouts(companyId: string, query: QueryPayoutDto) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  async adminListPayouts(query: QueryPayoutDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.company = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { name: true, slug: true } } },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  async getStats() {
    const [totalPayouts, completedCount, totalAmount, pendingCount] = await Promise.all([
      this.prisma.payout.count(),
      this.prisma.payout.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payout.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      this.prisma.payout.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalPayouts,
      completedCount,
      totalAmount: totalAmount._sum.amount ?? 0,
      pendingCount,
      failedCount: await this.prisma.payout.count({ where: { status: 'FAILED' } }),
    };
  }

  async processPendingPayouts() {
    const pending = await this.prisma.payout.findMany({ where: { status: 'PENDING', type: { not: 'MANUAL' } } });
    let processed = 0;
    let failed = 0;

    for (const payout of pending) {
      try {
        await this.processPayout(payout.id);
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process payout ${payout.id}: ${(err as Error).message}`);
        failed++;
      }
    }

    return { total: pending.length, processed, failed };
  }

  async processManualPayouts() {
    const manual = await this.prisma.payout.findMany({ where: { status: 'PENDING', type: 'MANUAL' } });
    let processed = 0;
    for (const payout of manual) {
      try {
        await this.markManual(payout.id);
        processed++;
      } catch {
        this.logger.warn(`Failed to mark payout ${payout.id} as manual`);
      }
    }
    return { total: manual.length, processed };
  }
}
