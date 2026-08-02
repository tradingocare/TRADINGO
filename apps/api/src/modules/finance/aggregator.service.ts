import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceDashboardService } from './finance-dashboard.service';
import { SettlementStatus, DisputeStatus } from '@prisma/client';

@Injectable()
export class FinanceAggregatorService {
  private readonly logger = new Logger(FinanceAggregatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: FinanceDashboardService,
  ) {}

  async getDashboardCards() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [
      totalRevenue,
      todayRevenue,
      pendingSettlements,
      escrowBalance,
      commissionEarned,
      refundQueue,
      activeDisputes,
      failedSettlements,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'CAPTURED' } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'CAPTURED', paidAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.settlement.count({ where: { status: 'PENDING' } }),
      this.prisma.escrow.aggregate({ _sum: { amount: true }, where: { status: { in: ['HELD', 'FROZEN', 'DISPUTED'] } } }),
      this.prisma.escrow.aggregate({ _sum: { commissionAmount: true }, where: { commissionAmount: { gt: 0 } } }),
      this.prisma.refund.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'NEGOTIATION', 'ESCALATED', 'ADMIN_ARBITRATION'] } } }),
      this.prisma.settlement.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      totalRevenue: (totalRevenue._sum.amount ?? 0) / 100,
      todayRevenue: (todayRevenue._sum.amount ?? 0) / 100,
      pendingSettlements,
      escrowBalance: (escrowBalance._sum.amount ?? 0) / 100,
      commissionEarned: (commissionEarned._sum.commissionAmount ?? 0) / 100,
      refundQueue,
      activeDisputes,
      failedSettlements,
    };
  }

  async getRevenueAnalytics(period: string = 'monthly', startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 365 * 86400000);

    if (period === 'daily') {
      const payments = await this.prisma.payment.findMany({
        where: { status: 'CAPTURED', paidAt: { gte: start, lte: end } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      });
      const dailyMap = new Map<string, number>();
      for (const p of payments) {
        if (!p.paidAt) continue;
        const key = p.paidAt.toISOString().slice(0, 10);
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + p.amount);
      }
      return Array.from(dailyMap.entries()).map(([date, revenue]) => ({ date, revenue: revenue / 100 }));
    }

    if (period === 'weekly') {
      const payments = await this.prisma.payment.findMany({
        where: { status: 'CAPTURED', paidAt: { gte: start, lte: end } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      });
      const weeklyMap = new Map<string, { revenue: number; weekStart: string }>();
      for (const p of payments) {
        if (!p.paidAt) continue;
        const d = new Date(p.paidAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        const entry = weeklyMap.get(key) ?? { revenue: 0, weekStart: key };
        entry.revenue += p.amount;
        weeklyMap.set(key, entry);
      }
      return Array.from(weeklyMap.values()).map((w) => ({ weekStart: w.weekStart, revenue: w.revenue / 100 }));
    }

    // monthly (default)
    const monthlyData = await this.dashboardService.getDashboard({ startDate: start.toISOString(), endDate: end.toISOString(), months: 12 });
    return monthlyData.monthlySummary;
  }

  async getSettlements(page: number = 1, limit: number = 20, status?: string, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { escrow: { booking: { id: { contains: search } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        include: {
          escrow: {
            select: { id: true, status: true, amount: true, bookingId: true, commissionAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data: data.map((s: any) => ({
        id: s.id,
        status: s.status,
        amount: s.amount / 100,
        escrowId: s.escrowId,
        escrowStatus: s.escrow?.status ?? null,
        bookingId: s.escrow?.bookingId ?? null,
        commissionAmount: (s.escrow?.commissionAmount ?? 0) / 100,
        processedAt: s.processedAt?.toISOString() ?? null,
        settledAt: s.settledAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async getRefunds(page: number = 1, limit: number = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          payment: { select: { id: true, amount: true, status: true, companyId: true, notes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      data: data.map((r) => ({
        id: r.id,
        status: r.status,
        amount: r.amount / 100,
        reason: r.reason,
        gatewayRefundId: r.gatewayRefundId,
        paymentId: r.paymentId,
        paymentAmount: (r.payment?.amount ?? 0) / 100,
        paymentStatus: r.payment?.status ?? null,
        companyId: r.payment?.companyId ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async getDisputes(page: number = 1, limit: number = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: { select: { id: true, status: true, amount: true } },
          raisedByCompany: { select: { id: true, name: true } },
          againstCompany: { select: { id: true, name: true } },
          timeline: { orderBy: { createdAt: 'asc' } },
          resolution: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: data.map((d) => ({
        id: d.id,
        disputeNumber: d.disputeNumber,
        status: d.status,
        type: d.type,
        reason: d.reason,
        amount: d.amount ? d.amount / 100 : null,
        bookingId: d.bookingId,
        bookingStatus: d.booking?.status ?? null,
        bookingAmount: d.booking?.amount ? Number(d.booking.amount) : null,
        raisedBy: d.raisedByCompany?.name ?? 'Unknown',
        against: d.againstCompany?.name ?? 'Unknown',
        timeline: d.timeline.map((t) => ({ type: t.type, description: t.description, createdAt: t.createdAt.toISOString() })),
        resolution: d.resolution
          ? { type: d.resolution.resolutionType, description: d.resolution.description }
          : null,
        createdAt: d.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async getCommissions() {
    const [totalCommissions, totalCommissionValue, rules, commissionByMonth] = await Promise.all([
      this.prisma.escrow.count({ where: { commissionAmount: { gt: 0 } } }),
      this.prisma.escrow.aggregate({ _sum: { commissionAmount: true }, where: { commissionAmount: { gt: 0 } } }),
      this.prisma.commissionRule.findMany({ orderBy: { priority: 'asc' } }),
      this.getMonthlyCommissionTrend(),
    ]);

    return {
      totalCommissions,
      totalPlatformRevenue: (totalCommissionValue._sum.commissionAmount ?? 0) / 100,
      activeRules: rules.filter((r) => r.isActive !== false).length,
      rules: rules.map((r) => ({
        id: r.id,
        name: r.name,
        ruleType: r.ruleType ?? 'PLATFORM_DEFAULT',
        calcType: r.calcType,
        percent: r.percent,
        fixedFee: r.fixedFee,
        priority: r.priority,
        scope: r.scope,
        isActive: r.isActive,
      })),
      monthlyTrend: commissionByMonth,
    };
  }

  async getReconciliation(page: number = 1, limit: number = 20, bookingId?: string) {
    const where: any = { bookingId: { not: null } };
    if (bookingId) where.bookingId = bookingId;

    const [escrows, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where,
        include: {
          booking: { select: { id: true, status: true, paymentStatus: true, amount: true } },
          settlements: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.escrow.count({ where }),
    ]);

    const data = escrows.map((e) => {
      const bookingAmount = e.booking ? Math.round(Number(e.booking.amount) * 100) : 0;
      const settlementAmount = e.settlements[0]?.amount ?? 0;
      const expectedSettlement = e.netAmount - e.commissionAmount;
      return {
        bookingId: e.bookingId,
        bookingAmount: bookingAmount / 100,
        gatewayAmount: bookingAmount / 100,
        escrowAmount: e.amount / 100,
        escrowStatus: e.status,
        commissionAmount: (e.commissionAmount ?? 0) / 100,
        netAmount: e.netAmount / 100,
        expectedSettlement: Math.max(0, expectedSettlement) / 100,
        actualSettlement: settlementAmount / 100,
        settlementStatus: e.settlements[0]?.status ?? null,
        isMatched: settlementAmount === expectedSettlement,
        heldAt: e.heldAt?.toISOString() ?? null,
        releasedAt: e.releasedAt?.toISOString() ?? null,
      };
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async search(query: string) {
    const [settlements, refunds, disputes, escrows] = await Promise.all([
      this.prisma.settlement.findMany({ where: { id: { contains: query } }, take: 5 }),
      this.prisma.refund.findMany({ where: { id: { contains: query } }, take: 5 }),
      this.prisma.dispute.findMany({ where: { disputeNumber: { contains: query } }, take: 5 }),
      this.prisma.escrow.findMany({ where: { bookingId: { contains: query } }, take: 5 }),
    ]);

    return {
      settlements: settlements.map((s) => ({ id: s.id, status: s.status, amount: s.amount / 100 })),
      refunds: refunds.map((r) => ({ id: r.id, status: r.status, amount: r.amount / 100 })),
      disputes: disputes.map((d) => ({ id: d.id, disputeNumber: d.disputeNumber, status: d.status })),
      escrows: escrows.map((e) => ({ id: e.id, bookingId: e.bookingId, status: e.status, amount: e.amount / 100 })),
    };
  }

  async getExportData(entity: string, status?: string, startDate?: string, endDate?: string): Promise<any[]> {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    switch (entity) {
      case 'settlements': {
        const items = await this.prisma.settlement.findMany({
          where: { ...(status ? { status: status as SettlementStatus } : {}), createdAt: { gte: start, lte: end } },
          include: { escrow: { select: { bookingId: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return items.map((s: any) => ({ ID: s.id, Status: s.status, Amount: s.amount / 100, BookingId: s.escrow?.bookingId ?? '', CreatedAt: s.createdAt.toISOString(), ProcessedAt: s.processedAt?.toISOString() ?? '' }));
      }
      case 'refunds': {
        const items = await this.prisma.refund.findMany({
          where: { ...(status ? { status } : {}), createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'desc' },
        });
        return items.map((r) => ({ ID: r.id, Status: r.status, Amount: r.amount / 100, Reason: r.reason ?? '', CreatedAt: r.createdAt.toISOString() }));
      }
      case 'disputes': {
        const items = await this.prisma.dispute.findMany({
          where: { ...(status ? { status: status as DisputeStatus } : {}), createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'desc' },
        });
        return items.map((d) => ({ ID: d.id, Number: d.disputeNumber, Status: d.status, Type: d.type, Reason: d.reason, Amount: d.amount ? d.amount / 100 : '', CreatedAt: d.createdAt.toISOString() }));
      }
      default:
        return [];
    }
  }

  /**
   * Authoritative revenue source — uses Payment.amount WHERE status = 'CAPTURED'.
   * All services MUST use this method for consistent revenue numbers.
   */
  async getAuthoritativeRevenue(options?: {
    startDate?: Date;
    endDate?: Date;
    includeYesterday?: boolean;
    includeGrowth?: boolean;
  }) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(todayStart.getTime() - 60 * 86400000);

    const base: any = { status: 'CAPTURED' };

    const [totalRevenue, todayRevenue, yesterdayRevenue, monthRevenue, prevMonthRevenue,
      revenue30d, revenuePrev] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: base }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: yesterdayStart, lt: todayStart } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: thirtyDaysAgo } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { ...base, paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const total = (totalRevenue._sum.amount ?? 0) / 100;
    const today = (todayRevenue._sum.amount ?? 0) / 100;
    const yesterday = (yesterdayRevenue._sum.amount ?? 0) / 100;
    const thisMonth = (monthRevenue._sum.amount ?? 0) / 100;
    const lastMonth = (prevMonthRevenue._sum.amount ?? 0) / 100;
    const last30d = (revenue30d._sum.amount ?? 0) / 100;
    const prev30d = (revenuePrev._sum.amount ?? 0) / 100;

    const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    const revenueGrowth30d = prev30d > 0 ? ((last30d - prev30d) / prev30d) * 100 : 0;

    return {
      total,
      today,
      yesterday,
      todayChange: yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0,
      thisMonth,
      lastMonth,
      monthChange,
      last30d,
      prev30d,
      revenueGrowth30d,
    };
  }

  private async getMonthlyCommissionTrend() {
    const escrows = await this.prisma.escrow.findMany({
      where: { commissionAmount: { gt: 0 } },
      select: { commissionAmount: true, heldAt: true },
    });
    const monthlyMap = new Map<string, number>();
    for (const e of escrows) {
      if (!e.heldAt) continue;
      const key = `${e.heldAt.getFullYear()}-${String(e.heldAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + e.commissionAmount);
    }
    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount: amount / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
