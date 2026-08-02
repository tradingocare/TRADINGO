import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CompanySegment {
  companyId: string;
  companyName: string;
  recency: number;
  frequency: number;
  monetary: number;
  segment: 'champions' | 'loyal' | 'potential' | 'new' | 'at_risk' | 'cannot_lose' | 'hibernating' | 'lost';
  revenue: number;
}

export interface SegmentSummary {
  name: string;
  label: string;
  count: number;
  totalRevenue: number;
  avgMonetary: number;
  description: string;
}

const SEGMENT_MAP: Array<{ name: CompanySegment['segment']; label: string; desc: string; rMin: number; rMax: number; fMin: number; fMax: number; mMin: number; mMax: number }> = [
  { name: 'champions', label: 'Champions', desc: 'Highest value — bought recently, often, and spent big', rMin: 4, rMax: 5, fMin: 4, fMax: 5, mMin: 4, mMax: 5 },
  { name: 'loyal', label: 'Loyal Customers', desc: 'Regular buyers with solid spend', rMin: 2, rMax: 5, fMin: 3, fMax: 5, mMin: 3, mMax: 5 },
  { name: 'potential', label: 'Potential Loyalists', desc: 'Recent buyers with moderate spend — nurture them', rMin: 3, rMax: 5, fMin: 1, fMax: 3, mMin: 2, mMax: 4 },
  { name: 'new', label: 'New Customers', desc: 'First-time recent buyers — engage early', rMin: 4, rMax: 5, fMin: 1, fMax: 2, mMin: 1, mMax: 3 },
  { name: 'at_risk', label: 'At Risk', desc: 'Big spenders who haven\'t bought recently', rMin: 1, rMax: 2, fMin: 3, fMax: 5, mMin: 3, mMax: 5 },
  { name: 'cannot_lose', label: 'Cannot Lose', desc: 'High spend but dormant — reactivate urgently', rMin: 1, rMax: 2, fMin: 1, fMax: 3, mMin: 4, mMax: 5 },
  { name: 'hibernating', label: 'Hibernating', desc: 'Low spend, not recent — need win-back', rMin: 1, rMax: 2, fMin: 1, fMax: 2, mMin: 1, mMax: 3 },
  { name: 'lost', label: 'Lost', desc: 'No activity in extended period', rMin: 1, rMax: 1, fMin: 1, fMax: 1, mMin: 1, mMax: 1 },
];

function quintile(value: number, breaks: [number, number, number, number]): number {
  if (value <= breaks[0]) return 1;
  if (value <= breaks[1]) return 2;
  if (value <= breaks[2]) return 3;
  if (value <= breaks[3]) return 4;
  return 5;
}

@Injectable()
export class CustomerSegmentationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSegments(companyId?: string): Promise<SegmentSummary[]> {
    const raw = await this.computeSegments(companyId);
    return SEGMENT_MAP.map(s => {
      const matched = raw.filter(r => r.segment === s.name);
      return {
        name: s.name,
        label: s.label,
        count: matched.length,
        totalRevenue: matched.reduce((a, r) => a + r.revenue, 0),
        avgMonetary: matched.length > 0 ? Math.round(matched.reduce((a, r) => a + r.monetary, 0) / matched.length) : 0,
        description: s.desc,
      };
    });
  }

  async getCompaniesBySegment(segment: string, companyId?: string): Promise<CompanySegment[]> {
    const raw = await this.computeSegments(companyId);
    return raw.filter(r => r.segment === segment);
  }

  private async computeSegments(companyId?: string): Promise<CompanySegment[]> {
    const buyerCompanyIds = (await this.prisma.order.groupBy({
      by: ['buyerCompanyId'], _count: { id: true },
    })).map(o => o.buyerCompanyId);

    const sellerCompanyIds = (await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { companyId: true },
      distinct: ['companyId'],
    })).map(p => p.companyId);

    const activeIds = [...new Set([...buyerCompanyIds, ...sellerCompanyIds])];
    if (activeIds.length === 0) return [];

    let ids = activeIds;
    if (companyId) {
      if (!activeIds.includes(companyId)) return [];
      ids = [companyId];
    }

    const companies = await this.prisma.company.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, createdAt: true },
      take: 200,
    });

    if (companies.length === 0) return [];

    const orderAggs = await this.prisma.order.groupBy({
      by: ['buyerCompanyId'],
      _count: { id: true },
      _max: { createdAt: true },
      where: { buyerCompanyId: { in: companies.map(c => c.id) } },
    });
    const orderMap = new Map(orderAggs.map(o => [o.buyerCompanyId, { count: o._count.id, lastDate: o._max.createdAt }]));

    const paidOrders = await this.prisma.order.findMany({
      where: { buyerCompanyId: { in: companies.map(c => c.id) }, payments: { some: { status: 'CAPTURED' } } },
      select: { buyerCompanyId: true, payments: { where: { status: 'CAPTURED' }, select: { amount: true } } },
    });
    const spendMap = new Map<string, number>();
    for (const o of paidOrders) {
      const total = o.payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const cur = spendMap.get(o.buyerCompanyId) ?? 0;
      spendMap.set(o.buyerCompanyId, cur + total);
    }

    const now = Date.now();
    const days = companies.length > 0
      ? Math.max(1, Math.ceil((now - Math.min(...companies.map(c => c.createdAt.getTime()))) / 86400000))
      : 1;

    const allRecencies = companies.map(c => {
      const o = orderMap.get(c.id);
      return o?.lastDate ? Math.max(0, Math.ceil((now - o.lastDate.getTime()) / 86400000)) : days;
    }).sort((a, b) => a - b);
    const rBreaks: [number, number, number, number] = [
      allRecencies[Math.floor(allRecencies.length * 0.2)] || 1,
      allRecencies[Math.floor(allRecencies.length * 0.4)] || 30,
      allRecencies[Math.floor(allRecencies.length * 0.6)] || 90,
      allRecencies[Math.floor(allRecencies.length * 0.8)] || 180,
    ];

    const allFreqs = companies.map(c => orderMap.get(c.id)?.count ?? 0).sort((a, b) => a - b);
    const fBreaks: [number, number, number, number] = [
      allFreqs[Math.floor(allFreqs.length * 0.2)] || 1,
      allFreqs[Math.floor(allFreqs.length * 0.4)] || 3,
      allFreqs[Math.floor(allFreqs.length * 0.6)] || 5,
      allFreqs[Math.floor(allFreqs.length * 0.8)] || 10,
    ];

    const allMonetary = companies.map(c => Number(spendMap.get(c.id) ?? 0)).sort((a, b) => a - b);
    const mBreaks: [number, number, number, number] = [
      allMonetary[Math.floor(allMonetary.length * 0.2)] || 100,
      allMonetary[Math.floor(allMonetary.length * 0.4)] || 1000,
      allMonetary[Math.floor(allMonetary.length * 0.6)] || 5000,
      allMonetary[Math.floor(allMonetary.length * 0.8)] || 10000,
    ];

    return companies.map(c => {
      const o = orderMap.get(c.id);
      const recency = o?.lastDate ? Math.max(0, Math.ceil((now - o.lastDate.getTime()) / 86400000)) : days;
      const frequency = o?.count ?? 0;
      const monetary = Number(spendMap.get(c.id) ?? 0);

      const r = quintile(days - recency, rBreaks.map(b => days - b) as [number, number, number, number]);
      const f = quintile(frequency, fBreaks);
      const m = quintile(monetary, mBreaks);

      let segment: CompanySegment['segment'] = 'new';
      for (const s of SEGMENT_MAP) {
        if (r >= s.rMin && r <= s.rMax && f >= s.fMin && f <= s.fMax && m >= s.mMin && m <= s.mMax) {
          segment = s.name;
          break;
        }
      }

      return { companyId: c.id, companyName: c.name, recency, frequency, monetary, segment, revenue: monetary };
    });
  }
}
