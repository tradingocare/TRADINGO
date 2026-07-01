import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GOCASHWalletType, GOCASHLedgerDirection, GOCASHLedgerStatus, GOCASHTransactionType } from '@prisma/client';

export interface LedgerCreditParams {
  walletId: string;
  amount: number;
  type: GOCASHTransactionType;
  reason: string;
  actorId: string;
  actorType: string;
  referenceId?: string;
  referenceType?: string;
  sourceType?: string;
  sourceSystem?: string;
  idempotencyKey?: string;
  notes?: string;
  currency?: string;
}

export interface LedgerDebitParams {
  walletId: string;
  amount: number;
  type: GOCASHTransactionType;
  reason: string;
  actorId: string;
  actorType: string;
  referenceId?: string;
  referenceType?: string;
  sourceType?: string;
  sourceSystem?: string;
  idempotencyKey?: string;
  notes?: string;
  currency?: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  direction: GOCASHLedgerDirection;
  status: GOCASHLedgerStatus;
  type: GOCASHTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  actorId: string;
  actorType: string;
  idempotencyKey: string | null;
  createdAt: Date;
}

@Injectable()
export class GocashService {
  constructor(private readonly prisma: PrismaService) {}

  async createWallet(
    userId: string,
    companyId: string | undefined,
    type: GOCASHWalletType,
    kycVerified = false,
  ) {
    const existing = await this.prisma.gOCASH_Wallet.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Wallet already exists for this user');
    }

    return this.prisma.gOCASH_Wallet.create({
      data: {
        userId,
        companyId: companyId ?? null,
        type,
        currentBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        lockedBalance: 0,
        expiredBalance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        lifetimeExpired: 0,
        kycVerified,
        status: 'ACTIVE',
      },
    });
  }

  async credit(params: LedgerCreditParams): Promise<LedgerEntry> {
    const { walletId, amount, type, reason, actorId, actorType, idempotencyKey } = params;

    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    if (idempotencyKey) {
      const existing = await this.verifyIdempotency(idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.gOCASH_Wallet.findUnique({
        where: { id: walletId },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.status === 'SUSPENDED' || wallet.status === 'EXPIRED') {
        throw new BadRequestException(`Wallet is ${wallet.status.toLowerCase()}`);
      }

      const balanceBefore = Number(wallet.currentBalance);
      const balanceAfter = balanceBefore + amount;

      const entry = await tx.gOCASH_Transaction.create({
        data: {
          walletId,
          direction: 'CREDIT',
          status: 'SUCCESS',
          type,
          amount,
          balanceBefore,
          balanceAfter,
          currency: params.currency ?? 'GOCASH',
          reason,
          referenceId: params.referenceId ?? null,
          referenceType: params.referenceType ?? null,
          sourceType: params.sourceType ?? null,
          sourceSystem: params.sourceSystem ?? null,
          idempotencyKey: idempotencyKey ?? null,
          notes: params.notes ?? null,
          actorId,
          actorType,
        },
      });

      await tx.gOCASH_Wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: balanceAfter,
          availableBalance: { increment: amount },
          lifetimeEarned: { increment: amount },
        },
      });

      return this.mapEntry(entry);
    });
  }

  async debit(params: LedgerDebitParams): Promise<LedgerEntry> {
    const { walletId, amount, type, reason, actorId, actorType, idempotencyKey } = params;

    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    if (idempotencyKey) {
      const existing = await this.verifyIdempotency(idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.gOCASH_Wallet.findUnique({
        where: { id: walletId },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.status !== 'ACTIVE') {
        throw new BadRequestException(`Wallet is ${wallet.status.toLowerCase()}`);
      }

      const availableBalance = Number(wallet.availableBalance);
      if (availableBalance < amount) {
        throw new BadRequestException(
          `Insufficient available balance: ${availableBalance} < ${amount}`,
        );
      }

      const balanceBefore = Number(wallet.currentBalance);
      const balanceAfter = balanceBefore - amount;

      const entry = await tx.gOCASH_Transaction.create({
        data: {
          walletId,
          direction: 'DEBIT',
          status: 'SUCCESS',
          type,
          amount,
          balanceBefore,
          balanceAfter,
          currency: params.currency ?? 'GOCASH',
          reason,
          referenceId: params.referenceId ?? null,
          referenceType: params.referenceType ?? null,
          sourceType: params.sourceType ?? null,
          sourceSystem: params.sourceSystem ?? null,
          idempotencyKey: idempotencyKey ?? null,
          notes: params.notes ?? null,
          actorId,
          actorType,
        },
      });

      await tx.gOCASH_Wallet.update({
        where: { id: walletId },
        data: {
          currentBalance: balanceAfter,
          availableBalance: { decrement: amount },
          lifetimeRedeemed: { increment: amount },
        },
      });

      return this.mapEntry(entry);
    });
  }

  async reverse(transactionId: string, reason: string, actorId: string, notes?: string): Promise<LedgerEntry> {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.gOCASH_Transaction.findUnique({
        where: { id: transactionId },
      });
      if (!original) {
        throw new NotFoundException('Transaction not found');
      }
      if (original.status === 'REVERSED') {
        throw new BadRequestException('Transaction is already reversed');
      }

      const wallet = await tx.gOCASH_Wallet.findUnique({
        where: { id: original.walletId },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const oppositeDirection = original.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';
      const amount = Number(original.amount);
      const balanceBefore = Number(wallet.currentBalance);

      if (oppositeDirection === 'DEBIT' && Number(wallet.availableBalance) < amount) {
        throw new BadRequestException('Insufficient balance to reverse transaction');
      }

      const balanceAfter = oppositeDirection === 'CREDIT'
        ? balanceBefore + amount
        : balanceBefore - amount;

      const entry = await tx.gOCASH_Transaction.create({
        data: {
          walletId: original.walletId,
          direction: oppositeDirection,
          status: 'SUCCESS',
          type: 'ADMIN_CORRECTION',
          amount,
          balanceBefore,
          balanceAfter,
          currency: original.currency,
          reason,
          referenceId: transactionId,
          referenceType: 'REVERSAL',
          notes: notes ?? null,
          actorId,
          actorType: 'ADMIN',
          idempotencyKey: null,
        },
      });

      const updateData: any = {
        currentBalance: balanceAfter,
      };
      if (oppositeDirection === 'CREDIT') {
        updateData.availableBalance = { increment: amount };
      } else {
        updateData.availableBalance = { decrement: amount };
      }

      await tx.gOCASH_Wallet.update({
        where: { id: original.walletId },
        data: updateData,
      });

      return this.mapEntry(entry);
    });
  }

  async redeem(
    walletId: string,
    amount: number,
    redemptionType: string,
    reference?: string,
    _notes?: string, // unused in this phase; reserved for future audit enrichment
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Redemption amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.gOCASH_Wallet.findUnique({
        where: { id: walletId },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      if (wallet.status !== 'ACTIVE') {
        throw new BadRequestException(`Wallet is ${wallet.status.toLowerCase()}`);
      }
      if (Number(wallet.availableBalance) < amount) {
        throw new BadRequestException('Insufficient available balance for redemption');
      }

      const redemption = await tx.gOCASH_Redemption.create({
        data: {
          walletId,
          amount,
          redemptionType: redemptionType as any,
          status: 'PENDING',
          reference: reference ?? null,
          redeemedAt: new Date(),
        },
      });

      return redemption;
    });
  }

  async approveRedemption(id: string, approverId: string) {
    return this.prisma.$transaction(async (tx) => {
      const redemption = await tx.gOCASH_Redemption.findUnique({
        where: { id },
        include: { wallet: true },
      });
      if (!redemption) {
        throw new NotFoundException('Redemption not found');
      }
      if (redemption.status !== 'PENDING') {
        throw new BadRequestException(`Redemption is ${redemption.status.toLowerCase()}, not PENDING`);
      }

      const wallet = redemption.wallet;
      const amount = Number(redemption.amount);
      const balanceBefore = Number(wallet.currentBalance);
      const balanceAfter = balanceBefore - amount;

      if (Number(wallet.availableBalance) < amount) {
        throw new BadRequestException('Insufficient available balance');
      }

      const entry = await tx.gOCASH_Transaction.create({
        data: {
          walletId: redemption.walletId,
          direction: 'DEBIT',
          status: 'SUCCESS',
          type: 'REDEMPTION',
          amount,
          balanceBefore,
          balanceAfter,
          currency: 'GOCASH',
          reason: `Redemption approved: ${redemption.reference ?? redemption.id}`,
          referenceId: redemption.id,
          referenceType: 'REDEMPTION',
          actorId: approverId,
          actorType: 'ADMIN',
          idempotencyKey: null,
          notes: null,
        },
      });

      await tx.gOCASH_Wallet.update({
        where: { id: redemption.walletId },
        data: {
          currentBalance: balanceAfter,
          availableBalance: { decrement: amount },
          lifetimeRedeemed: { increment: amount },
        },
      });

      await tx.gOCASH_Redemption.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: approverId,
        },
      });

      return { redemption: { ...redemption, status: 'APPROVED', approvedAt: new Date(), approvedBy: approverId }, transaction: this.mapEntry(entry) };
    });
  }

  async rejectRedemption(id: string, rejectionReason: string) {
    const redemption = await this.prisma.gOCASH_Redemption.findUnique({
      where: { id },
    });
    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }
    if (redemption.status !== 'PENDING') {
      throw new BadRequestException(`Redemption is ${redemption.status.toLowerCase()}, not PENDING`);
    }

    return this.prisma.gOCASH_Redemption.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason,
      },
    });
  }

  async getBalance(walletId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }
    return wallet;
  }

  async getLedger(
    walletId: string,
    query: {
      page?: number;
      limit?: number;
      direction?: GOCASHLedgerDirection;
      status?: GOCASHLedgerStatus;
      type?: GOCASHTransactionType;
      from?: string;
      to?: string;
      referenceId?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { walletId };

    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.referenceId) where.referenceId = query.referenceId;

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [entries, total] = await Promise.all([
      this.prisma.gOCASH_Transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gOCASH_Transaction.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.mapEntry(e)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getTransaction(id: string): Promise<LedgerEntry> {
    const entry = await this.prisma.gOCASH_Transaction.findUnique({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException('Transaction not found');
    }
    return this.mapEntry(entry);
  }

  async verifyIdempotency(key: string): Promise<LedgerEntry | null> {
    const existing = await this.prisma.gOCASH_Transaction.findUnique({
      where: { idempotencyKey: key },
    });
    if (!existing) return null;
    return this.mapEntry(existing);
  }

  async adminListWallets(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { userId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [wallets, total] = await Promise.all([
      this.prisma.gOCASH_Wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gOCASH_Wallet.count({ where }),
    ]);

    return {
      data: wallets,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminGetWalletStats() {
    const stats = await this.prisma.gOCASH_Wallet.aggregate({
      _count: { id: true },
      _sum: { currentBalance: true, availableBalance: true, lockedBalance: true, lifetimeEarned: true, lifetimeRedeemed: true },
    });

    const [active, locked, suspended, expired, buyer, seller] = await Promise.all([
      this.prisma.gOCASH_Wallet.count({ where: { status: 'ACTIVE' } }),
      this.prisma.gOCASH_Wallet.count({ where: { status: 'LOCKED' } }),
      this.prisma.gOCASH_Wallet.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.gOCASH_Wallet.count({ where: { status: 'EXPIRED' } }),
      this.prisma.gOCASH_Wallet.count({ where: { type: 'BUYER' } }),
      this.prisma.gOCASH_Wallet.count({ where: { type: 'SELLER' } }),
    ]);

    return {
      totalWallets: stats._count.id,
      buyerWallets: buyer,
      sellerWallets: seller,
      totalBalance: stats._sum.currentBalance ?? 0,
      totalAvailable: stats._sum.availableBalance ?? 0,
      totalLocked: stats._sum.lockedBalance ?? 0,
      totalLifetimeEarned: stats._sum.lifetimeEarned ?? 0,
      totalLifetimeRedeemed: stats._sum.lifetimeRedeemed ?? 0,
      activeWallets: active,
      lockedWallets: locked,
      suspendedWallets: suspended,
      expiredWallets: expired,
    };
  }

  async getRedemptions(walletId: string) {
    return this.prisma.gOCASH_Redemption.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private mapEntry(entry: any): LedgerEntry {
    return {
      id: entry.id,
      walletId: entry.walletId,
      direction: entry.direction,
      status: entry.status,
      type: entry.type,
      amount: Number(entry.amount),
      balanceBefore: Number(entry.balanceBefore),
      balanceAfter: Number(entry.balanceAfter),
      currency: entry.currency,
      reason: entry.reason,
      referenceId: entry.referenceId,
      referenceType: entry.referenceType,
      actorId: entry.actorId,
      actorType: entry.actorType,
      idempotencyKey: entry.idempotencyKey,
      createdAt: entry.createdAt,
    };
  }
}
