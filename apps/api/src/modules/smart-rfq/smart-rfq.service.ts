import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqService } from '../rfq/rfq.service';
import { PaginationDto, buildPaginationQuery, buildPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SmartRfqService {
  private readonly logger = new Logger(SmartRfqService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rfqService: RfqService,
  ) {}

  async getUserCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('User has no company');
    return owner.company;
  }

  async createFromSource(userId: string, data: {
    title: string; description?: string; rfqType: string; source: string; sourceId?: string;
    visibility?: string; urgency?: string; budgetMin?: number; budgetMax?: number; showBudget?: boolean;
    currency?: string; quantity?: number; unit?: string; preferredLocation?: string;
    deliveryAddress?: any; paymentPreference?: string; expiresAt?: string;
    categoryId?: string; industryId?: string;
    locations?: { city: string; state?: string; country?: string; pincode?: string; isPrimary?: boolean }[];
    attachments?: { type: string; url: string; originalName?: string; mimeType?: string; fileSize?: number }[];
    productItems?: { productId?: string; categoryId?: string; productName: string; description?: string; quantity?: number; unit?: string; targetPrice?: number; isService?: boolean }[];
  }) {
    const company = await this.getUserCompany(userId);

    const rfq = await this.prisma.rfq.create({
      data: {
        companyId: company.id,
        userId,
        title: data.title,
        description: data.description,
        rfqType: data.rfqType as any,
        source: data.source as any,
        sourceId: data.sourceId,
        visibility: (data.visibility as any) ?? 'PUBLIC',
        urgency: (data.urgency as any) ?? 'NORMAL',
        status: 'DRAFT',
        budgetMin: data.budgetMin ?? undefined,
        budgetMax: data.budgetMax ?? undefined,
        showBudget: data.showBudget ?? false,
        currency: data.currency ?? 'INR',
        quantity: data.quantity,
        unit: data.unit,
        preferredLocation: data.preferredLocation,
        deliveryAddress: data.deliveryAddress ?? undefined,
        paymentPreference: data.paymentPreference,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        categoryId: data.categoryId,
        industryId: data.industryId,
        createdBy: userId,
        updatedBy: userId,
        locations: data.locations?.length
          ? { create: data.locations.map((l) => ({ city: l.city, state: l.state, country: l.country ?? 'India', pincode: l.pincode, isPrimary: l.isPrimary ?? false })) }
          : undefined,
        attachments: data.attachments?.length
          ? { create: data.attachments.map((a) => ({ type: a.type as any, url: a.url, originalName: a.originalName, mimeType: a.mimeType, fileSize: a.fileSize })) }
          : undefined,
        productItems: data.productItems?.length
          ? { create: data.productItems.map((p) => ({ categoryId: p.categoryId, productName: p.productName, description: p.description, quantity: p.quantity, unit: p.unit, targetPrice: p.targetPrice, isService: p.isService ?? false })) }
          : undefined,
      },
      include: { locations: true, attachments: true, productItems: true },
    });

    if (data.source === 'CONVERSATION' && data.sourceId) {
      await this.prisma.conversation.update({
        where: { id: data.sourceId },
        data: { rfqId: rfq.id, updatedAt: new Date() },
      });
    }

    return rfq;
  }

  async duplicate(userId: string, rfqId: string) {
    const company = await this.getUserCompany(userId);
    const original = await this.prisma.rfq.findFirst({ where: { id: rfqId, companyId: company.id }, include: { locations: true, attachments: true, productItems: true } });
    if (!original) throw new NotFoundException('RFQ not found');

    const duplicate = await this.prisma.rfq.create({
      data: {
        companyId: company.id,
        userId,
        title: `${original.title} (Copy)`,
        description: original.description,
        rfqType: original.rfqType,
        source: 'DIRECT' as any,
        visibility: original.visibility,
        urgency: original.urgency,
        status: 'DRAFT',
        budgetMin: original.budgetMin,
        budgetMax: original.budgetMax,
        showBudget: original.showBudget,
        currency: original.currency,
        quantity: original.quantity,
        unit: original.unit,
        preferredLocation: original.preferredLocation,
        deliveryAddress: (original.deliveryAddress as object) ?? undefined,
        paymentPreference: original.paymentPreference,
        categoryId: original.categoryId,
        industryId: original.industryId,
        createdBy: userId,
        updatedBy: userId,
        locations: original.locations?.length
          ? { create: original.locations.map((l) => ({ city: l.city, state: l.state, country: l.country, pincode: l.pincode, isPrimary: l.isPrimary })) }
          : undefined,
        productItems: original.productItems?.length
          ? { create: original.productItems.map((p) => ({ categoryId: p.categoryId, productName: p.productName, description: p.description, quantity: p.quantity, unit: p.unit, targetPrice: p.targetPrice, isService: p.isService })) }
          : undefined,
      },
      include: { locations: true, productItems: true },
    });

    return duplicate;
  }

  async findById(userId: string, rfqId: string) {
    const company = await this.getUserCompany(userId);
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: company.id, deletedAt: null },
      include: {
        locations: true,
        attachments: true,
        productItems: true,
        _count: { select: { quotes: true, vendorMatches: true } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async updateRfq(userId: string, rfqId: string, data: { title?: string; description?: string; expiresAt?: string; status?: string }) {
    const company = await this.getUserCompany(userId);
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: company.id, deletedAt: null },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'DRAFT') throw new BadRequestException('Only draft RFQs can be edited');

    const updateData: any = { updatedBy: userId };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);
    if (data.status !== undefined) updateData.status = data.status;

    await this.prisma.rfq.update({ where: { id: rfqId }, data: updateData });
    return this.findById(userId, rfqId);
  }

  async findQuotes(userId: string, rfqId: string) {
    const company = await this.getUserCompany(userId);
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: company.id, deletedAt: null },
      select: { id: true },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const quotes = await this.prisma.quote.findMany({
      where: { rfqId, status: { in: ['SUBMITTED', 'VIEWED', 'ACCEPTED', 'REJECTED'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
        company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, responseRate: true, verificationLevel: true } },
      },
    });
    return quotes;
  }

  async acceptQuote(userId: string, rfqId: string, quoteId: string) {
    const company = await this.getUserCompany(userId);
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: company.id, deletedAt: null },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, rfqId, status: { in: ['SUBMITTED', 'VIEWED'] } },
    });
    if (!quote) throw new BadRequestException('Quote not found or already processed');

    const [updated] = await this.prisma.$transaction([
      this.prisma.quote.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } }),
      this.prisma.rfq.update({ where: { id: rfqId }, data: { status: 'CLOSED' } }),
      this.prisma.quote.updateMany({
        where: { rfqId, id: { not: quoteId }, status: { in: ['SUBMITTED', 'VIEWED'] } },
        data: { status: 'REJECTED' },
      }),
    ]);
    return updated;
  }

  async rejectQuote(userId: string, rfqId: string, quoteId: string) {
    const company = await this.getUserCompany(userId);
    const rfq = await this.prisma.rfq.findFirst({
      where: { id: rfqId, companyId: company.id, deletedAt: null },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, rfqId, status: { in: ['SUBMITTED', 'VIEWED'] } },
    });
    if (!quote) throw new BadRequestException('Quote not found or already processed');

    return this.prisma.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED' } });
  }

  async findMyRfqs(userId: string, status?: string, pagination?: PaginationDto) {
    const company = await this.getUserCompany(userId);
    const where: any = { companyId: company.id, deletedAt: null };
    if (status) where.status = status;

    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
        include: {
          locations: true,
          productItems: { take: 5 },
          _count: { select: { quotes: true, vendorMatches: true } },
        },
      }),
      this.prisma.rfq.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  // ─── PERFORMANCE METRICS ─────────────────────────────────────

  async getRfqQualityMetrics(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const rfqWhere: any = { companyId, deletedAt: null };
    if (startDate || endDate) rfqWhere.createdAt = dateFilter;

    const [rfqs, total, byStatus, quotesData, converted] = await Promise.all([
      this.prisma.rfq.findMany({
        where: rfqWhere,
        select: { id: true, createdAt: true, description: true, budgetMin: true, budgetMax: true, deliveryAddress: true, paymentPreference: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.rfq.count({ where: rfqWhere }),
      this.prisma.rfq.groupBy({ by: ['status'], _count: true, where: rfqWhere }),
      this.prisma.quote.findMany({
        where: { rfq: { companyId, deletedAt: null } },
        select: { rfqId: true, totalAmount: true, createdAt: true },
        orderBy: { rfqId: 'asc', createdAt: 'asc' },
      }),
      this.prisma.rfq.count({ where: { ...rfqWhere, status: 'CONVERTED' } }),
    ]);

    let completenessSum = 0;
    const rfqQuoteMap: Record<string, { count: number; firstQuoteAt: Date }> = {};
    const quoteValues: number[] = [];

    for (const q of quotesData) {
      const e = rfqQuoteMap[q.rfqId];
      if (e) { e.count++; } else { rfqQuoteMap[q.rfqId] = { count: 1, firstQuoteAt: q.createdAt }; }
      if (q.totalAmount) quoteValues.push(Number(q.totalAmount));
    }

    let rfqsWithQuotes = 0;
    let totalHours = 0;
    let hoursCount = 0;

    for (const rfq of rfqs) {
      const filled = [rfq.description, rfq.budgetMin, rfq.budgetMax, rfq.deliveryAddress, rfq.paymentPreference].filter(Boolean).length;
      completenessSum += filled / 5;
      const qi = rfqQuoteMap[rfq.id];
      if (qi) {
        rfqsWithQuotes++;
        const hrs = (qi.firstQuoteAt.getTime() - rfq.createdAt.getTime()) / 3600000;
        if (hrs >= 0) { totalHours += hrs; hoursCount++; }
      }
    }

    return {
      totalRfqs: total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      completenessScore: total > 0 ? Math.round((completenessSum / total) * 10000) / 100 : 0,
      responseRate: total > 0 ? Math.round((rfqsWithQuotes / total) * 10000) / 100 : 0,
      avgResponseTimeHours: hoursCount > 0 ? Math.round((totalHours / hoursCount) * 100) / 100 : 0,
      avgQuotesPerRfq: total > 0 ? Math.round((quotesData.length / total) * 100) / 100 : 0,
      avgQuoteValue: quoteValues.length > 0 ? Math.round(quoteValues.reduce((a, b) => a + b, 0) / quoteValues.length * 100) / 100 : 0,
      conversionRate: total > 0 ? Math.round((converted / total) * 10000) / 100 : 0,
    };
  }

  async getQuotePerformanceMetrics(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const where: any = { OR: [{ rfq: { companyId } }, { companyId }] };
    if (startDate || endDate) where.createdAt = dateFilter;

    const [total, byStatus, amountAgg] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.groupBy({ by: ['status'], _count: true, where }),
      this.prisma.quote.aggregate({ where: { ...where, status: { notIn: ['DRAFT', 'WITHDRAWN'] } }, _sum: { totalAmount: true } }),
    ]);

    const accepted = byStatus.find(s => s.status === 'ACCEPTED')?._count || 0;
    const rejected = byStatus.find(s => s.status === 'REJECTED')?._count || 0;
    const submitted = byStatus.find(s => s.status === 'SUBMITTED')?._count || 0;
    const expired = byStatus.find(s => s.status === 'EXPIRED')?._count || 0;
    const negotiating = byStatus.find(s => s.status === 'NEGOTIATING')?._count || 0;

    return {
      totalQuotes: total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 10000) / 100 : 0,
      pendingRate: total > 0 ? Math.round(((submitted + negotiating) / total) * 10000) / 100 : 0,
      expirationRate: total > 0 ? Math.round((expired / total) * 10000) / 100 : 0,
      avgQuoteValue: total > 0 ? Math.round(Number(amountAgg._sum.totalAmount || 0) / total * 100) / 100 : 0,
    };
  }
}
