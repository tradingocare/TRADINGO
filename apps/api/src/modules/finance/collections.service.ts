import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollectionNoteDto, UpdateCollectionNoteDto, QueryCollectionsDto } from './dto';
import { PaymentStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOutstandingSummary() {
    const [totalOverduePayments, totalOverdueInvoices, totalPending] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.PENDING, createdAt: { lt: new Date(Date.now() - 30 * 86400000) } } }),
      this.prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: InvoiceStatus.OVERDUE } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.PENDING } }),
    ]);
    return {
      totalOverdue: Number(totalOverduePayments._sum.amount || 0) + Number(totalOverdueInvoices._sum.totalAmount || 0),
      totalPending: Number(totalPending._sum.amount || 0),
      overduePayments: Number(totalOverduePayments._sum.amount || 0),
      overdueInvoices: Number(totalOverdueInvoices._sum.totalAmount || 0),
    };
  }

  async getAgingReport() {
    const now = Date.now();
    const buckets = [
      { label: '0-30 days', minDays: 0, maxDays: 30 },
      { label: '31-60 days', minDays: 31, maxDays: 60 },
      { label: '61-90 days', minDays: 61, maxDays: 90 },
      { label: '90+ days', minDays: 91, maxDays: Infinity },
    ];

    const payments = await this.prisma.payment.findMany({ where: { status: PaymentStatus.PENDING }, select: { amount: true, createdAt: true, companyId: true } });

    const results = buckets.map(bucket => {
      const filtered = payments.filter(p => {
        const days = Math.floor((now - p.createdAt.getTime()) / 86400000);
        return days >= bucket.minDays && days <= bucket.maxDays;
      });
      return { bucket: bucket.label, count: filtered.length, amount: filtered.reduce((s, p) => s + p.amount, 0) };
    });

    return results;
  }

  async listOverdueCompanies(query: QueryCollectionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const overdueThreshold = new Date(Date.now() - 30 * 86400000);

    const overduePayments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING, createdAt: { lt: overdueThreshold }, company: query.search ? { name: { contains: query.search, mode: 'insensitive' } } : undefined },
      select: { companyId: true, amount: true, createdAt: true },
    });

    const companyMap = new Map<string, { totalOverdue: number; daysSinceFirst: number; paymentCount: number; earliestDate: Date }>();
    for (const p of overduePayments) {
      const existing = companyMap.get(p.companyId) || { totalOverdue: 0, daysSinceFirst: 0, paymentCount: 0, earliestDate: p.createdAt };
      existing.totalOverdue += p.amount;
      existing.paymentCount++;
      if (p.createdAt < existing.earliestDate) existing.earliestDate = p.createdAt;
      companyMap.set(p.companyId, existing);
    }

    let entries = Array.from(companyMap.entries()).map(([companyId, data]) => ({
      companyId, totalOverdue: data.totalOverdue, paymentCount: data.paymentCount,
      daysOverdue: Math.floor((Date.now() - data.earliestDate.getTime()) / 86400000),
    }));
    entries.sort((a, b) => b.totalOverdue - a.totalOverdue);
    const total = entries.length;
    entries = entries.slice((page - 1) * limit, page * limit);

    const companies = await this.prisma.company.findMany({
      where: { id: { in: entries.map(e => e.companyId) } },
      select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true, trustScore: true, assignedRm: { select: { id: true, name: true } } },
    });
    const companyLookup = new Map(companies.map(c => [c.id, c]));

    return {
      data: entries.map(e => ({ ...e, company: companyLookup.get(e.companyId) || null })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async createNote(companyId: string, dto: CreateCollectionNoteDto, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    const note = await this.prisma.collectionNote.create({
      data: { companyId, actionType: dto.actionType, content: dto.content, contactedPerson: dto.contactedPerson, outcome: dto.outcome, followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : undefined, createdBy: userId },
    });
    await this.prisma.collectionTimelineEvent.create({
      data: { companyId, type: 'NOTE_ADDED', description: `Collection note: ${dto.actionType} - ${dto.content.substring(0, 100)}`, createdBy: userId },
    });
    return note;
  }

  async listNotes(companyId: string) {
    return this.prisma.collectionNote.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async getTimeline(companyId: string) {
    const events = await this.prisma.collectionTimelineEvent.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 200 });
    const payments = await this.prisma.payment.findMany({ where: { companyId, status: PaymentStatus.CAPTURED }, select: { id: true, amount: true, paidAt: true }, orderBy: { paidAt: 'desc' }, take: 50 });
    const invoiceEvents = payments.map(p => ({ id: `payment-${p.id}`, type: 'PAYMENT_RECEIVED' as const, description: `Payment of ₹${(p.amount / 100).toLocaleString()} received`, createdAt: p.paidAt || new Date(), source: 'payment' as const }));
    const merged = [
      ...events.map(e => ({ id: e.id, type: e.type, description: e.description || '', createdAt: e.createdAt, source: 'collection' as const })),
      ...invoiceEvents,
    ];
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return merged.slice(0, 200);
  }
}
