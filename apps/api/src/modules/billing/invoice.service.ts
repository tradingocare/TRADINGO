import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaxService, TaxResult } from './tax.service';

export interface GenerateInvoiceParams {
  companyId: string;
  paymentId: string;
  planId: string;
  planName: string;
  planTier: string;
  amount: number;
  discountAmount?: number;
  gstNumber?: string;
  billingName?: string;
  billingAddress?: any;
  isIntraState?: boolean;
  taxExempt?: boolean;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxService: TaxService,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = 'TRD-INV';

    const seq = await this.prisma.invoiceSequence.upsert({
      where: { prefix_year: { prefix, year } },
      update: { lastSeq: { increment: 1 } },
      create: { prefix, year, lastSeq: 1 },
    });

    return `${prefix}-${year}-${String(seq.lastSeq).padStart(6, '0')}`;
  }

  async createSubscriptionInvoice(params: GenerateInvoiceParams): Promise<any> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const hsnSac = this.taxService.getHsnSacForPlan(params.planId);
    const tax: TaxResult = this.taxService.calculateGst(
      params.amount - (params.discountAmount || 0),
      params.isIntraState !== false,
      params.taxExempt || false,
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        type: 'SUBSCRIPTION',
        companyId: params.companyId,
        paymentId: params.paymentId,
        planId: params.planId,
        planName: params.planName,
        planTier: params.planTier,
        subtotal: params.amount - (params.discountAmount || 0),
        taxAmount: tax.totalTax,
        discountAmount: params.discountAmount || 0,
        totalAmount: tax.totalTax + (params.amount - (params.discountAmount || 0)),
        currency: 'INR',
        billingName: params.billingName || null,
        billingAddress: params.billingAddress || null,
        gstNumber: params.gstNumber || null,
        gstType: tax.taxType === 'CGST_SGST' ? 'CGST' : tax.taxType === 'IGST' ? 'IGST' : null,
        cgstAmount: tax.cgstAmount || null,
        sgstAmount: tax.sgstAmount || null,
        igstAmount: tax.igstAmount || null,
        hsnSacCode: hsnSac,
        status: 'GENERATED',
        issuedAt: new Date(),
        paidAt: new Date(),
      },
    });

    await this.prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `${params.planName} - ${params.planTier === 'A' ? 'Annual' : params.planTier === 'B' ? '2 Years' : '3 Years'}`,
        hsnSacCode: hsnSac,
        quantity: 1,
        unitPrice: params.amount - (params.discountAmount || 0),
        amount: params.amount - (params.discountAmount || 0),
        sortOrder: 1,
      },
    });

    if (tax.totalTax > 0) {
      const breakdowns = [];
      if (tax.cgstAmount > 0) {
        breakdowns.push({ invoiceId: invoice.id, taxType: 'CGST' as any, rate: tax.cgstRate, amount: tax.cgstAmount, sortOrder: 1 });
      }
      if (tax.sgstAmount > 0) {
        breakdowns.push({ invoiceId: invoice.id, taxType: 'SGST' as any, rate: tax.sgstRate, amount: tax.sgstAmount, sortOrder: 2 });
      }
      if (tax.igstAmount > 0) {
        breakdowns.push({ invoiceId: invoice.id, taxType: 'IGST' as any, rate: tax.igstRate, amount: tax.igstAmount, sortOrder: 3 });
      }
      if (breakdowns.length > 0) {
        await this.prisma.taxBreakdown.createMany({ data: breakdowns });
      }
    }

    await this.prisma.invoiceHistory.create({
      data: {
        invoiceId: invoice.id,
        status: 'GENERATED',
        changedBy: 'system',
        note: 'Invoice generated after successful payment',
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} created for company ${params.companyId}`);
    return invoice;
  }

  async getInvoiceWithDetails(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        taxBreakdown: { orderBy: { sortOrder: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } },
        company: {
          select: {
            id: true, name: true, email: true, mobile: true,
            gstNumber: true, panNumber: true,
            locations: { where: { deletedAt: null }, take: 1 },
          },
        },
        payment: {
          select: {
            id: true, gateway: true, gatewayOrderId: true,
            gatewayPaymentId: true, amount: true, paidAt: true,
          },
        },
      },
    });
    return invoice;
  }

  async getInvoicesByCompany(companyId: string, page = 1, limit = 20, filters?: { status?: string; search?: string }) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { planName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          taxBreakdown: true,
          payment: { select: { gateway: true, gatewayPaymentId: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async voidInvoice(invoiceId: string, reason: string, changedBy: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'VOID') throw new Error('Invoice already void');

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'VOID', voidAt: new Date(), voidReason: reason },
    });

    await this.prisma.invoiceHistory.create({
      data: {
        invoiceId, status: 'VOID', changedBy, note: reason,
      },
    });

    return { success: true };
  }

  async getBillingHistory(companyId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [payments, invoices, planHistory] = await Promise.all([
      this.prisma.payment.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: {
          id: true, type: true, gateway: true, status: true,
          amount: true, currency: true, paidAt: true, createdAt: true,
        },
      }),
      this.prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: {
          id: true, invoiceNumber: true, totalAmount: true,
          status: true, planName: true, issuedAt: true,
        },
      }),
      this.prisma.planHistory.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
    ]);

    const events = [
      ...payments.map(p => ({
        id: p.id, type: 'payment' as const, subtype: p.status,
        label: `${p.type} - ${p.status}`, gateway: p.gateway,
        amount: p.amount, date: p.paidAt || p.createdAt,
      })),
      ...invoices.map(i => ({
        id: i.id, type: 'invoice' as const, subtype: i.status,
        label: i.invoiceNumber, planName: i.planName,
        amount: Number(i.totalAmount), date: i.issuedAt,
      })),
      ...planHistory.map(h => ({
        id: h.id, type: 'plan_change' as const, subtype: h.changeType,
        label: `${h.changeType} - ${h.planId}`,
        amount: h.amount, date: h.createdAt,
      })),
    ];

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { events, total: events.length, page, limit };
  }
}
