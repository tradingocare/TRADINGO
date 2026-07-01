import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService, LedgerEntry } from '../gocash/gocash.service';
import { WalletSearchDto, LedgerSearchDto, StatementQueryDto, ManualCreditDto, ManualDebitDto, ReverseTransactionDto } from './dto';
import { GOCASHWalletStatus, Prisma } from '@prisma/client';

@Injectable()
export class WalletApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gocashService: GocashService,
  ) {}

  // ─── Buyer ─────────────────────────────────────────────────

  async getBuyerWallet(userId: string) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    const recentTxns = await this.gocashService.getLedger(wallet.id, { page: 1, limit: 5 });
    return {
      id: wallet.id,
      balance: Number(wallet.currentBalance),
      available: Number(wallet.availableBalance),
      pending: Number(wallet.pendingBalance),
      locked: Number(wallet.lockedBalance),
      lifetimeEarned: Number(wallet.lifetimeEarned),
      lifetimeRedeemed: Number(wallet.lifetimeRedeemed),
      status: wallet.status,
      recentTransactions: recentTxns.data,
    };
  }

  async getBuyerBalance(userId: string) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    return {
      balance: Number(wallet.currentBalance),
      available: Number(wallet.availableBalance),
      pending: Number(wallet.pendingBalance),
      locked: Number(wallet.lockedBalance),
    };
  }

  async getBuyerTransactions(userId: string, query: LedgerSearchDto) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    return this.gocashService.getLedger(wallet.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      direction: query.direction,
      status: query.status,
      type: query.type,
      from: query.from,
      to: query.to,
      referenceId: query.referenceId,
    });
  }

  async getBuyerRewards(userId: string, query: { page?: number; limit?: number }) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    return this.gocashService.getLedger(wallet.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      direction: 'CREDIT',
      type: undefined,
    });
  }

  async getBuyerStatement(userId: string, query: StatementQueryDto) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    const { from, to } = this.resolveDateRange(query);
    const txns = await this.gocashService.getLedger(wallet.id, { page: 1, limit: 1000, from, to });
    return {
      walletId: wallet.id,
      period: query.period ?? 'custom',
      from,
      to,
      openingBalance: this.calcOpeningBalance(txns.data),
      closingBalance: Number(wallet.currentBalance),
      totalCredits: txns.data.filter((t) => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0),
      totalDebits: txns.data.filter((t) => t.direction === 'DEBIT').reduce((s, t) => s + t.amount, 0),
      transactions: txns.data,
    };
  }

  // ─── Seller ────────────────────────────────────────────────

  async getSellerWallet(userId: string) {
    return this.getBuyerWallet(userId);
  }

  async getSellerTransactions(userId: string, query: LedgerSearchDto) {
    return this.getBuyerTransactions(userId, query);
  }

  async getSellerStatement(userId: string, query: StatementQueryDto) {
    return this.getBuyerStatement(userId, query);
  }

  async getSellerAnalytics(userId: string) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    const allTxns = await this.gocashService.getLedger(wallet.id, { page: 1, limit: 1000 });

    const byType: Record<string, { count: number; total: number }> = {};
    for (const t of allTxns.data) {
      const key = t.type;
      if (!byType[key]) byType[key] = { count: 0, total: 0 };
      byType[key].count++;
      byType[key].total += t.amount;
    }

    const membership = byType['MEMBERSHIP_BONUS'] ?? { count: 0, total: 0 };
    const referral = byType['REFERRAL_REWARD'] ?? { count: 0, total: 0 };
    const campaign = byType['CAMPAIGN_REWARD'] ?? { count: 0, total: 0 };

    return {
      totalTransactions: allTxns.data.length,
      totalEarned: Number(wallet.lifetimeEarned),
      totalRedeemed: Number(wallet.lifetimeRedeemed),
      currentBalance: Number(wallet.currentBalance),
      membershipRewards: { count: membership.count, total: membership.total },
      referralRewards: { count: referral.count, total: referral.total },
      campaignRewards: { count: campaign.count, total: campaign.total },
      byType,
    };
  }

  // ─── Admin ─────────────────────────────────────────────────

  async adminSearchWallets(query: WalletSearchDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GOCASH_WalletWhereInput = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { userId: { contains: query.search, mode: 'insensitive' } },
        { companyId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.gOCASH_Wallet.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.gOCASH_Wallet.count({ where }),
    ]);

    return {
      data: data.map((w) => ({
        id: w.id,
        userId: w.userId,
        companyId: w.companyId,
        type: w.type,
        balance: Number(w.currentBalance),
        available: Number(w.availableBalance),
        status: w.status,
        kycVerified: w.kycVerified,
        createdAt: w.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGetWalletDetail(walletId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const txnCount = await this.prisma.gOCASH_Transaction.count({ where: { walletId } });
    const redemptionCount = await this.prisma.gOCASH_Redemption.count({ where: { walletId } });

    return {
      id: wallet.id,
      userId: wallet.userId,
      companyId: wallet.companyId,
      type: wallet.type,
      currentBalance: Number(wallet.currentBalance),
      availableBalance: Number(wallet.availableBalance),
      pendingBalance: Number(wallet.pendingBalance),
      lockedBalance: Number(wallet.lockedBalance),
      expiredBalance: Number(wallet.expiredBalance),
      lifetimeEarned: Number(wallet.lifetimeEarned),
      lifetimeRedeemed: Number(wallet.lifetimeRedeemed),
      lifetimeExpired: Number(wallet.lifetimeExpired),
      status: wallet.status,
      kycVerified: wallet.kycVerified,
      lockedUntil: wallet.lockedUntil,
      createdAt: wallet.createdAt,
      transactionCount: txnCount,
      redemptionCount,
    };
  }

  async adminFreezeWallet(walletId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status !== 'ACTIVE') throw new BadRequestException(`Wallet is already ${wallet.status.toLowerCase()}`);

    return this.prisma.gOCASH_Wallet.update({ where: { id: walletId }, data: { status: 'LOCKED' as GOCASHWalletStatus } });
  }

  async adminUnfreezeWallet(walletId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status !== 'LOCKED') throw new BadRequestException('Wallet is not locked');

    return this.prisma.gOCASH_Wallet.update({ where: { id: walletId }, data: { status: 'ACTIVE' as GOCASHWalletStatus } });
  }

  async adminManualCredit(dto: ManualCreditDto, actorId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.gocashService.credit({
      walletId: dto.walletId,
      amount: dto.amount,
      type: 'MANUAL_CREDIT',
      reason: dto.reason,
      actorId,
      actorType: 'ADMIN',
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      sourceType: 'MANUAL',
      sourceSystem: 'WALLET_API',
      notes: dto.notes,
    });
  }

  async adminManualDebit(dto: ManualDebitDto, actorId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.gocashService.debit({
      walletId: dto.walletId,
      amount: dto.amount,
      type: 'MANUAL_DEBIT',
      reason: dto.reason,
      actorId,
      actorType: 'ADMIN',
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      sourceType: 'MANUAL',
      sourceSystem: 'WALLET_API',
      notes: dto.notes,
    });
  }

  async adminAdjustBalance(walletId: string, amount: number, reason: string, notes: string | undefined, actorId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (amount >= 0) {
      return this.gocashService.credit({
        walletId, amount, type: 'ADJUSTMENT', reason, actorId, actorType: 'ADMIN',
        sourceType: 'ADJUSTMENT', sourceSystem: 'WALLET_API', notes,
      });
    }
    return this.gocashService.debit({
      walletId, amount: Math.abs(amount), type: 'ADMIN_CORRECTION', reason, actorId, actorType: 'ADMIN',
      sourceType: 'ADJUSTMENT', sourceSystem: 'WALLET_API', notes,
    });
  }

  async adminReverseTransaction(dto: ReverseTransactionDto, actorId: string) {
    const txn = await this.prisma.gOCASH_Transaction.findUnique({ where: { id: dto.transactionId } });
    if (!txn) throw new NotFoundException('Transaction not found');

    return this.gocashService.reverse(dto.transactionId, dto.reason, actorId, dto.notes);
  }

  async adminSearchLedger(query: LedgerSearchDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GOCASH_TransactionWhereInput = {};
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { walletId: { contains: query.search, mode: 'insensitive' } },
        { referenceId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.referenceId) where.referenceId = query.referenceId;
    if (query.referenceType) where.referenceType = query.referenceType;
    if (query.sourceSystem) where.sourceSystem = query.sourceSystem;
    if (query.walletId) where.walletId = query.walletId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.gOCASH_Transaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.gOCASH_Transaction.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        direction: t.direction,
        status: t.status,
        type: t.type,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        currency: t.currency,
        reason: t.reason,
        referenceId: t.referenceId,
        referenceType: t.referenceType,
        sourceSystem: t.sourceSystem,
        actorId: t.actorId,
        actorType: t.actorType,
        idempotencyKey: t.idempotencyKey,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGetFraudAlerts() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const rapidTxns = await this.prisma.gOCASH_Transaction.groupBy({
      by: ['walletId'],
      where: { createdAt: { gte: oneDayAgo } },
      _count: { id: true },
    });

    const highVelocity = rapidTxns.filter((w) => w._count.id > 50).map((w) => ({
      walletId: w.walletId,
      transactionCount: w._count.id,
      alert: `High transaction velocity: ${w._count.id} transactions in 24 hours`,
    }));

    const failedAttempts = await this.prisma.gOCASH_Transaction.count({
      where: { status: 'FAILED', createdAt: { gte: oneDayAgo } },
    });

    const reversedCount = await this.prisma.gOCASH_Transaction.count({
      where: { status: 'REVERSED', createdAt: { gte: oneDayAgo } },
    });

    return {
      alerts: [
        ...highVelocity.map((h) => h.alert),
        failedAttempts > 10 ? `High failure rate: ${failedAttempts} failed transactions in 24h` : null,
        reversedCount > 5 ? `Unusual reversal activity: ${reversedCount} reversals in 24h` : null,
      ].filter(Boolean),
      highVelocity,
      failedAttempts,
      reversedCount,
      totalTransactions: highVelocity.reduce((s, w) => s + w.transactionCount, 0),
    };
  }

  async getFraudSummary() {
    const oneDayAgo = new Date(); oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const [walletAlerts, referralAlerts, disputeCount, blacklistCount, rapidReferrals] = await Promise.all([
      this.adminGetFraudAlerts(),
      this.prisma.referralAudit.count({ where: { action: 'REJECTED', createdAt: { gte: oneDayAgo } } }),
      this.prisma.dispute.count({ where: { status: { notIn: ['RESOLVED', 'REFUNDED', 'REJECTED', 'CANCELLED', 'EXPIRED'] } } }),
      this.prisma.referralBlacklist.count(),
      this.prisma.referralUsage.count({ where: { status: 'REJECTED', createdAt: { gte: oneDayAgo } } }),
    ]);

    return {
      summary: {
        totalAlerts: walletAlerts.alerts.length + (referralAlerts > 0 ? 1 : 0),
        highVelocityWallets: walletAlerts.highVelocity.length,
        failedTransactions24h: walletAlerts.failedAttempts,
        reversals24h: walletAlerts.reversedCount,
        rejectedReferrals24h: rapidReferrals,
        referralAuditAlerts24h: referralAlerts,
        openDisputes: disputeCount,
        blacklistedEntries: blacklistCount,
      },
      walletAlerts: walletAlerts.alerts,
      highVelocityWallets: walletAlerts.highVelocity,
    };
  }

  async adminGetWalletAudit(walletId: string) {
    const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const txns = await this.prisma.gOCASH_Transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return {
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        type: wallet.type,
        status: wallet.status,
        currentBalance: Number(wallet.currentBalance),
        createdAt: wallet.createdAt,
      },
      totalTransactions: txns.length,
      totalCredits: txns.filter((t) => t.direction === 'CREDIT').reduce((s, t) => s + Number(t.amount), 0),
      totalDebits: txns.filter((t) => t.direction === 'DEBIT').reduce((s, t) => s + Number(t.amount), 0),
      transactions: txns.slice(0, 100),
    };
  }

  // ─── Statements ────────────────────────────────────────────

  async generateStatement(userId: string, query: StatementQueryDto) {
    const wallet = await this.gocashService.getWalletByUserId(userId);
    const { from, to } = this.resolveDateRange(query);

    const txns = await this.gocashService.getLedger(wallet.id, { page: 1, limit: 10000, from, to });

    return {
      generatedAt: new Date().toISOString(),
      period: query.period ?? 'custom',
      from,
      to,
      walletId: wallet.id,
      openingBalance: this.calcOpeningBalance(txns.data),
      closingBalance: Number(wallet.currentBalance),
      summary: {
        totalCredits: txns.data.filter((t) => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0),
        totalDebits: txns.data.filter((t) => t.direction === 'DEBIT').reduce((s, t) => s + t.amount, 0),
        netChange: txns.data.filter((t) => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0)
          - txns.data.filter((t) => t.direction === 'DEBIT').reduce((s, t) => s + t.amount, 0),
        transactionCount: txns.data.length,
      },
      transactions: txns.data,
    };
  }

  async exportCsv(userId: string, query: StatementQueryDto) {
    const statement = await this.generateStatement(userId, query);
    const header = 'Date,Type,Direction,Amount,BalanceBefore,BalanceAfter,Reason,Reference,ReferenceType,Status';
    const rows = statement.transactions.map((t: LedgerEntry) =>
      `${new Date(t.createdAt).toISOString()},${t.type},${t.direction},${t.amount},${t.balanceBefore},${t.balanceAfter},"${t.reason}",${t.referenceId ?? ''},${t.referenceType ?? ''},${t.status}`,
    );
    return [header, ...rows].join('\n');
  }

  async exportStatement(userId: string, query: StatementQueryDto) {
    const statement = await this.generateStatement(userId, query);
    return {
      filename: `gocash-statement-${query.period ?? 'custom'}-${statement.from}.csv`,
      content: await this.exportCsv(userId, query),
      mimeType: 'text/csv',
    };
  }

  // ─── Analytics ─────────────────────────────────────────────

  async getGrowthAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const walletsCreated = await this.prisma.gOCASH_Wallet.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const txnVolume = await this.prisma.gOCASH_Transaction.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const txnAmount = await this.prisma.gOCASH_Transaction.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

    const stats = await this.gocashService.adminGetWalletStats();

    return {
      newWallets30d: walletsCreated,
      transactionVolume30d: txnVolume,
      transactionAmount30d: Number(txnAmount._sum.amount ?? 0),
      ...stats,
    };
  }

  async getDistributionAnalytics() {
    const txns = await this.prisma.gOCASH_Transaction.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return txns.map((t) => ({
      type: t.type,
      count: t._count.id,
      totalAmount: Number(t._sum.amount ?? 0),
    }));
  }

  async getTopWallets(limit = 10) {
    const wallets = await this.prisma.gOCASH_Wallet.findMany({
      orderBy: { lifetimeEarned: 'desc' },
      take: limit,
    });

    return wallets.map((w, i) => ({
      rank: i + 1,
      id: w.id,
      userId: w.userId,
      type: w.type,
      balance: Number(w.currentBalance),
      lifetimeEarned: Number(w.lifetimeEarned),
      lifetimeRedeemed: Number(w.lifetimeRedeemed),
    }));
  }

  async getRedemptionTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const redemptions = await this.prisma.gOCASH_Redemption.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const totalAmount = redemptions.reduce((s, r) => s + Number(r.amount), 0);
    const approved = redemptions.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + Number(r.amount), 0);
    const pending = redemptions.filter((r) => r.status === 'PENDING').reduce((s, r) => s + Number(r.amount), 0);

    return {
      totalRedemptions: redemptions.length,
      totalAmount,
      approvedAmount: approved,
      pendingAmount: pending,
      byType: redemptions.reduce((acc, r) => {
        const key = r.redemptionType;
        if (!acc[key]) acc[key] = { count: 0, total: 0 };
        acc[key].count++;
        acc[key].total += Number(r.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private resolveDateRange(query: StatementQueryDto) {
    const now = new Date();
    let from: Date;
    let to = new Date();

    if (query.from && query.to) {
      from = new Date(query.from);
      to = new Date(query.to);
    } else if (query.period === 'yearly') {
      from = new Date(now.getFullYear(), 0, 1);
    } else if (query.period === 'quarterly') {
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { from: from.toISOString(), to: to.toISOString() };
  }

  private calcOpeningBalance(txns: LedgerEntry[]) {
    if (txns.length === 0) return 0;
    return txns[0].balanceBefore;
  }
}
