import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCreditNoteDto, CreateDebitNoteDto, QueryNoteDto } from './dto';
import { Prisma, CreditNoteStatus, DebitNoteStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class CreditNoteService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await this.prisma.invoiceSequence.upsert({
      where: { prefix_year: { prefix, year } },
      create: { prefix, year, lastSeq: 1 },
      update: { lastSeq: { increment: 1 } },
    });
    return `${prefix}-${year}-${String(seq.lastSeq).padStart(5, '0')}`;
  }

  async createCreditNote(dto: CreateCreditNoteDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const creditNoteNumber = await this.generateNumber('TRD-CN');
    return this.prisma.creditNote.create({
      data: {
        creditNoteNumber, invoiceId: dto.invoiceId, companyId: invoice.companyId, reason: dto.reason,
        subtotal: new Prisma.Decimal(dto.subtotal), taxAmount: dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : undefined,
        totalAmount: new Prisma.Decimal(dto.totalAmount), currency: invoice.currency,
        gstNumber: invoice.gstNumber, gstType: invoice.gstType,
        cgstAmount: invoice.cgstAmount, sgstAmount: invoice.sgstAmount, igstAmount: invoice.igstAmount,
        hsnSacCode: invoice.hsnSacCode, status: CreditNoteStatus.DRAFT, notes: dto.notes,
        items: dto.items ? { create: dto.items.map((item, i) => ({ description: item.description, hsnSacCode: item.hsnSacCode, quantity: item.quantity || 1, unitPrice: new Prisma.Decimal(item.unitPrice), amount: new Prisma.Decimal(item.amount), sortOrder: i })) } : undefined,
      },
      include: { items: true, invoice: { select: { invoiceNumber: true } }, company: { select: { id: true, name: true } } },
    });
  }

  async issueCreditNote(id: string) {
    const cn = await this.prisma.creditNote.findUnique({ where: { id } });
    if (!cn) throw new NotFoundException('Credit note not found');
    return this.prisma.creditNote.update({ where: { id }, data: { status: CreditNoteStatus.ISSUED, issuedAt: new Date() } });
  }

  async cancelCreditNote(id: string, reason: string) {
    const cn = await this.prisma.creditNote.findUnique({ where: { id } });
    if (!cn) throw new NotFoundException('Credit note not found');
    if (cn.status === CreditNoteStatus.APPLIED) throw new BadRequestException('Cannot cancel an applied credit note');
    return this.prisma.creditNote.update({ where: { id }, data: { status: CreditNoteStatus.CANCELLED, cancelledAt: new Date(), cancelReason: reason } });
  }

  async listCreditNotes(query: QueryNoteDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.CreditNoteWhereInput = {};
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.status) where.status = query.status as CreditNoteStatus;
    if (query.search) where.creditNoteNumber = { contains: query.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.creditNote.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { items: true, invoice: { select: { invoiceNumber: true } }, company: { select: { id: true, name: true } } } }),
      this.prisma.creditNote.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getGstSummary(startDate?: Date, endDate?: Date) {
    const where: Prisma.CreditNoteWhereInput = { status: CreditNoteStatus.ISSUED };
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = startDate;
      if (endDate) where.issuedAt.lte = endDate;
    }
    const notes = await this.prisma.creditNote.findMany({ where, select: { totalAmount: true, cgstAmount: true, sgstAmount: true, igstAmount: true, gstType: true } });
    return {
      count: notes.length,
      totalValue: Number(notes.reduce((s, n) => s + Number(n.totalAmount), 0)),
      totalCgst: Number(notes.reduce((s, n) => s + Number(n.cgstAmount || 0), 0)),
      totalSgst: Number(notes.reduce((s, n) => s + Number(n.sgstAmount || 0), 0)),
      totalIgst: Number(notes.reduce((s, n) => s + Number(n.igstAmount || 0), 0)),
    };
  }

  async createDebitNote(dto: CreateDebitNoteDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const debitNoteNumber = await this.generateNumber('TRD-DN');
    return this.prisma.debitNote.create({
      data: {
        debitNoteNumber, invoiceId: dto.invoiceId, companyId: invoice.companyId, reason: dto.reason,
        subtotal: new Prisma.Decimal(dto.subtotal), taxAmount: dto.taxAmount ? new Prisma.Decimal(dto.taxAmount) : undefined,
        totalAmount: new Prisma.Decimal(dto.totalAmount), currency: invoice.currency,
        gstNumber: invoice.gstNumber, gstType: invoice.gstType,
        cgstAmount: invoice.cgstAmount, sgstAmount: invoice.sgstAmount, igstAmount: invoice.igstAmount,
        hsnSacCode: invoice.hsnSacCode, status: DebitNoteStatus.DRAFT, notes: dto.notes,
        items: dto.items ? { create: dto.items.map((item, i) => ({ description: item.description, hsnSacCode: item.hsnSacCode, quantity: item.quantity || 1, unitPrice: new Prisma.Decimal(item.unitPrice), amount: new Prisma.Decimal(item.amount), sortOrder: i })) } : undefined,
      },
      include: { items: true, invoice: { select: { invoiceNumber: true } }, company: { select: { id: true, name: true } } },
    });
  }

  async issueDebitNote(id: string) {
    const dn = await this.prisma.debitNote.findUnique({ where: { id } });
    if (!dn) throw new NotFoundException('Debit note not found');
    return this.prisma.debitNote.update({ where: { id }, data: { status: DebitNoteStatus.ISSUED, issuedAt: new Date() } });
  }

  async cancelDebitNote(id: string, reason: string) {
    const dn = await this.prisma.debitNote.findUnique({ where: { id } });
    if (!dn) throw new NotFoundException('Debit note not found');
    if (dn.status === DebitNoteStatus.APPLIED) throw new BadRequestException('Cannot cancel an applied debit note');
    return this.prisma.debitNote.update({ where: { id }, data: { status: DebitNoteStatus.CANCELLED, cancelledAt: new Date(), cancelReason: reason } });
  }

  async listDebitNotes(query: QueryNoteDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.DebitNoteWhereInput = {};
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.status) where.status = query.status as DebitNoteStatus;
    if (query.search) where.debitNoteNumber = { contains: query.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.debitNote.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { items: true, invoice: { select: { invoiceNumber: true } }, company: { select: { id: true, name: true } } } }),
      this.prisma.debitNote.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }
}
