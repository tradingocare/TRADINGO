import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceService } from './invoice.service';
import { PdfService } from './pdf.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly pdfService: PdfService,
  ) {}

  async getInvoices(companyId: string, page: number, limit: number, filters?: { status?: string; search?: string }) {
    return this.invoiceService.getInvoicesByCompany(companyId, page, limit, filters);
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.invoiceService.getInvoiceWithDetails(invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getInvoicePdf(invoiceId: string): Promise<{ html: string; filename: string }> {
    const invoice = await this.getInvoice(invoiceId);
    const html = this.pdfService.generateInvoiceHtml(invoice);
    const filename = `${invoice.invoiceNumber}.html`;
    return { html, filename };
  }

  async getBillingHistory(companyId: string, page: number, limit: number) {
    return this.invoiceService.getBillingHistory(companyId, page, limit);
  }

  async getTaxSummary(companyId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issuedAt: { gte: startDate, lte: endDate },
        status: { not: 'VOID' },
      },
      select: {
        invoiceNumber: true, totalAmount: true, taxAmount: true,
        cgstAmount: true, sgstAmount: true, igstAmount: true,
        issuedAt: true, planName: true,
      },
      orderBy: { issuedAt: 'desc' },
      take: 1000,
    });

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalTax = invoices.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const totalCgst = invoices.reduce((s, i) => s + Number(i.cgstAmount || 0), 0);
    const totalSgst = invoices.reduce((s, i) => s + Number(i.sgstAmount || 0), 0);
    const totalIgst = invoices.reduce((s, i) => s + Number(i.igstAmount || 0), 0);

    return {
      year: targetYear,
      totalInvoices: invoices.length,
      totalInvoiced,
      totalTax,
      totalCgst,
      totalSgst,
      totalIgst,
      invoices,
    };
  }

  // ── Revenue Overview (Admin) ──────────────────────────
  async getRevenueOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalPayments, monthPayments, yearPayments, invoiceStats, planBreakdown, monthlyRevenue] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { status: 'CAPTURED', paidAt: { gte: startOfYear } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { status: { not: 'VOID' } },
        _sum: { totalAmount: true, taxAmount: true },
        _count: true,
      }),
      this.prisma.invoice.groupBy({
        by: ['planName'],
        where: { status: { not: 'VOID' } },
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: { not: 'VOID' },
          issuedAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        },
        select: { totalAmount: true, issuedAt: true },
        orderBy: { issuedAt: 'asc' },
        take: 1000,
      }),
    ]);

    const totalRevenue = Number(totalPayments._sum.amount || 0) / 100;
    const monthRevenue = Number(monthPayments._sum.amount || 0) / 100;
    const yearRevenue = Number(yearPayments._sum.amount || 0) / 100;
    const mrr = monthRevenue;

    // Monthly revenue chart data
    const monthlyChart: Record<string, number> = {};
    for (const inv of monthlyRevenue) {
      const key = `${inv.issuedAt.getFullYear()}-${String(inv.issuedAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyChart[key] = (monthlyChart[key] || 0) + Number(inv.totalAmount);
    }
    const chartData = Object.entries(monthlyChart).map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

    // Active subscriptions
    const activeSubs = await this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE' } });

    return {
      totalRevenue,
      monthRevenue,
      yearRevenue,
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      totalTransactions: totalPayments._count,
      monthTransactions: monthPayments._count,
      activeSubscriptions: activeSubs,
      invoiceCount: invoiceStats._count || 0,
      totalInvoiced: Number(invoiceStats._sum.totalAmount || 0),
      totalTaxCollected: Number(invoiceStats._sum.taxAmount || 0),
      planBreakdown: planBreakdown.map(p => ({
        planName: p.planName || 'Unknown',
        revenue: Number(p._sum.totalAmount || 0),
        count: p._count,
      })),
      monthlyRevenue: chartData,
      currency: 'INR',
    };
  }

  // ── Proration Calculator ──────────────────────────────
  async calculateProratedAmount(companyId: string, newPlanPrice: number): Promise<{ proratedAmount: number; daysLeft: number; totalDays: number }> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionActivatedAt: true, subscriptionExpiresAt: true },
    });
    if (!company?.subscriptionActivatedAt || !company.subscriptionExpiresAt) {
      return { proratedAmount: newPlanPrice, daysLeft: 0, totalDays: 365 };
    }

    const totalMs = company.subscriptionExpiresAt.getTime() - company.subscriptionActivatedAt.getTime();
    const elapsedMs = Date.now() - company.subscriptionActivatedAt.getTime();
    const totalDays = Math.max(1, Math.ceil(totalMs / 86400000));
    const daysLeft = Math.max(0, Math.ceil((totalMs - elapsedMs) / 86400000));
    const proratedAmount = Math.round(newPlanPrice * (daysLeft / totalDays));

    return { proratedAmount, daysLeft, totalDays };
  }
}
