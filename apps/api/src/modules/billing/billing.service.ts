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
}
