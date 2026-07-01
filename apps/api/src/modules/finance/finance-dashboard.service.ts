import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryFinanceDashboardDto } from './dto';
import { PaymentStatus, PaymentType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: QueryFinanceDashboardDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 365 * 86400000);
    const months = query.months || 12;

    const [totalRevenue, totalReceivable, totalPayable, totalOutstanding, collectionAgg, paymentCounts] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED, paidAt: { gte: startDate, lte: endDate } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.PENDING } }),
      this.prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: InvoiceStatus.OVERDUE } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] }, createdAt: { lt: new Date(Date.now() - 30 * 86400000) } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED, paidAt: { gte: startDate, lte: endDate } } }),
      this.prisma.payment.groupBy({ by: ['status'], _count: true, where: { createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    const capturedAmount = Number(totalRevenue._sum.amount || 0);
    const pendingAmount = Number(totalReceivable._sum.amount || 0);
    const overdueAmount = Number(totalPayable._sum.totalAmount || 0);
    const outstandingAmount = Number(totalOutstanding._sum.amount || 0);
    const collectedAmount = Number(collectionAgg._sum.amount || 0);

    const monthlyData = await this.getMonthlySummary(startDate, endDate);

    return {
      revenue: capturedAmount / 100,
      receivable: pendingAmount / 100,
      payable: overdueAmount,
      outstanding: outstandingAmount / 100,
      collectionRate: (capturedAmount + pendingAmount) > 0 ? Number((capturedAmount / (capturedAmount + pendingAmount) * 100).toFixed(2)) : 0,
      collectedAmount: collectedAmount / 100,
      totalTransactions: paymentCounts.reduce((s, p) => s + p._count, 0),
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      monthlySummary: monthlyData,
    };
  }

  private async getMonthlySummary(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { amount: true, status: true, paidAt: true, createdAt: true },
    });

    const monthlyMap = new Map<string, { revenue: number; pending: number; refunded: number; count: number }>();
    for (const p of payments) {
      const date = p.paidAt || p.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key) || { revenue: 0, pending: 0, refunded: 0, count: 0 };
      if (p.status === PaymentStatus.CAPTURED) entry.revenue += p.amount;
      else if (p.status === PaymentStatus.PENDING) entry.pending += p.amount;
      else if (p.status === PaymentStatus.REFUNDED) entry.refunded += p.amount;
      entry.count++;
      monthlyMap.set(key, entry);
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, revenue: data.revenue / 100, pending: data.pending / 100, refunded: data.refunded / 100, transactions: data.count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getCashFlow(query: QueryFinanceDashboardDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 90 * 86400000);

    const [inflow, outflow] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.CAPTURED, paidAt: { gte: startDate, lte: endDate } } }),
      this.prisma.payout.aggregate({ _sum: { amount: true }, where: { status: 'PROCESSED', createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    return {
      inflow: Number(inflow._sum.amount || 0) / 100,
      outflow: Number(outflow._sum.amount || 0) / 100,
      net: (Number(inflow._sum.amount || 0) - Number(outflow._sum.amount || 0)) / 100,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
    };
  }
}
