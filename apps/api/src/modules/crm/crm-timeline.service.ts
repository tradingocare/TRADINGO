import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeadTimeline(leadId: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.crmTimelineEvent.findMany({
      where: { leadId }, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  async getCustomerTimeline(companyId: string, limit = 100) {
    const lead = await this.prisma.crmLead.findFirst({ where: { companyId } });
    const events: Array<{ type: string; description: string; date: Date; source: string }> = [];

    const [rfqs, quotes, negotiations, orders, shipments, payments, supportTickets] = await Promise.all([
      this.prisma.rfq.findMany({ where: { companyId }, select: { id: true, title: true, status: true, createdAt: true }, take: limit }),
      this.prisma.quote.findMany({ where: { OR: [{ rfq: { companyId } }] }, select: { id: true, status: true, totalAmount: true, createdAt: true }, take: limit }),
      this.prisma.negotiation.findMany({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] }, select: { id: true, status: true, createdAt: true }, take: limit }),
      this.prisma.order.findMany({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] }, select: { id: true, orderNumber: true, status: true, createdAt: true }, take: limit }),
      this.prisma.shipment.findMany({ where: { OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }] }, select: { id: true, status: true, createdAt: true }, take: limit }),
      this.prisma.payment.findMany({ where: { companyId }, select: { id: true, status: true, amount: true, createdAt: true }, take: limit }),
      this.prisma.supportTicket.findMany({ where: { companyId }, select: { id: true, subject: true, status: true, createdAt: true }, take: limit }),
    ]);

    rfqs.forEach(r => events.push({ type: 'RFQ', description: `RFQ: ${r.title || r.id}`, date: r.createdAt, source: 'RFQ' }));
    quotes.forEach(q => events.push({ type: 'QUOTE', description: `Quote: ₹${Number(q.totalAmount || 0).toLocaleString()}`, date: q.createdAt, source: 'Quote' }));
    negotiations.forEach(n => events.push({ type: 'NEGOTIATION', description: `Negotiation: ${n.status}`, date: n.createdAt, source: 'Negotiation' }));
    orders.forEach(o => events.push({ type: 'ORDER', description: `Order: ${o.orderNumber || o.id}`, date: o.createdAt, source: 'Order' }));
    shipments.forEach(s => events.push({ type: 'SHIPMENT', description: `Shipment: ${s.status}`, date: s.createdAt, source: 'Shipment' }));
    payments.forEach(p => events.push({ type: 'PAYMENT', description: `Payment: ₹${Number(p.amount || 0).toLocaleString()}`, date: p.createdAt, source: 'Payment' }));
    supportTickets.forEach(t => events.push({ type: 'SUPPORT_TICKET', description: `Support: ${t.subject}`, date: t.createdAt, source: 'SupportTicket' }));

    if (lead) {
      const leadEvents = await this.prisma.crmTimelineEvent.findMany({ where: { leadId: lead.id }, take: limit });
      leadEvents.forEach(e => events.push({ type: e.type, description: e.description || '', date: e.createdAt, source: 'CRM' }));
    }

    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events.slice(0, limit);
  }

  async addEvent(leadId: string, type: string, description: string, userId?: string) {
    const lead = await this.prisma.crmLead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.crmTimelineEvent.create({
      data: { leadId, type, description, createdBy: userId },
    });
  }
}
