import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { ReviseQuoteDto } from './dto/revise-quote.dto';

const MAX_REVISIONS = 5;
const MAX_VALIDITY_DAYS = 30;

const RANKING_WEIGHTS = {
  price: 0.30,
  deliveryTime: 0.25,
  trustScore: 0.20,
  rating: 0.15,
  responseTime: 0.10,
};

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(companyId: string, rfqId: string, userId: string, dto: CreateQuoteDto) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.companyId === companyId) throw new ForbiddenException('Buyer cannot quote on own RFQ');
    if (rfq.status !== 'ACTIVE') throw new BadRequestException('RFQ is not accepting quotes');

    const match = await this.prisma.rfqVendorMatch.findFirst({
      where: { rfqId, companyId, status: { in: ['SENT', 'VIEWED'] } },
    });
    if (!match) throw new ForbiddenException('Only matched vendors can quote');

    const existing = await this.prisma.quote.findFirst({
      where: { rfqId, companyId, status: { notIn: ['WITHDRAWN', 'REJECTED', 'EXPIRED'] } },
    });
    if (existing) throw new BadRequestException('You already have an active quote for this RFQ');

    if (dto.validityDate) {
      const validityDate = new Date(dto.validityDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + MAX_VALIDITY_DAYS);
      if (validityDate > maxDate) throw new BadRequestException(`Validity cannot exceed ${MAX_VALIDITY_DAYS} days`);
    }

    const quote = await this.prisma.$transaction(async (tx) => {
      const q = await tx.quote.create({
        data: {
          rfqId,
          companyId,
          userId,
          createdBy: userId,
          updatedBy: userId,
          quoteVersion: 1,
          currency: dto.currency ?? 'INR',
          subtotal: dto.subtotal,
          taxAmount: dto.taxAmount,
          totalAmount: dto.totalAmount,
          discountAmount: dto.discountAmount,
          discountPercent: dto.discountPercent,
          deliveryTerms: dto.deliveryTerms as any,
          paymentTerms: dto.paymentTerms as any,
          leadTimeDays: dto.leadTimeDays,
          leadTimeDisplay: dto.leadTimeDisplay,
          validityDate: dto.validityDate ? new Date(dto.validityDate) : null,
          notes: dto.notes,
          lineItems: dto.lineItems?.length
            ? { create: dto.lineItems.map((li) => ({
                rfqProductItemId: li.rfqProductItemId,
                productName: li.productName,
                description: li.description,
                quantity: li.quantity,
                unit: li.unit,
                unitPrice: li.unitPrice,
                totalPrice: li.quantity != null ? li.unitPrice * li.quantity : li.unitPrice,
                deliveryTerms: li.deliveryTerms as any,
                leadTimeDays: li.leadTimeDays,
                notes: li.notes,
              })) }
            : undefined,
          attachments: dto.attachments?.length
            ? { create: dto.attachments.map((a) => ({
                type: 'DOCUMENT' as any,
                url: a.url,
                originalName: a.originalName,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
              })) }
            : undefined,
        },
        include: { lineItems: true, attachments: true },
      });

      await tx.rfqVendorMatch.updateMany({
        where: { rfqId, companyId, status: { in: ['SENT', 'VIEWED'] } },
        data: { status: 'QUOTED' },
      });

      await tx.rfq.update({ where: { id: rfqId }, data: { quoteCount: { increment: 1 } } });

      return q;
    });

    await this.trackEvent(quote.id, companyId, 'QUOTE_CREATED', { rfqId });

    try {
      const vendor = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
      await this.notificationService.createWithTemplate(
        rfq.companyId,
        rfq.createdBy,
        NotificationType.QUOTE_RECEIVED,
        { rfqTitle: rfq.title, vendorName: vendor?.name ?? 'Vendor' },
      );
    } catch (err) {
      this.logger.error(`Failed to send QUOTE_RECEIVED notification: ${err.message}`);
    }

    return quote;
  }

  async findAll(rfqId: string, companyId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const isBuyer = rfq.companyId === companyId;
    const where: any = { rfqId };
    if (!isBuyer) where.companyId = companyId;

    const quotes = await this.prisma.quote.findMany({
      where,
      orderBy: isBuyer ? { createdAt: 'desc' } : { createdAt: 'desc' },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
        company: { select: { id: true, name: true, slug: true, trustScore: true, responseRate: true, verificationLevel: true } },
      },
    });

    if (isBuyer) {
      return this.rankQuotes(quotes);
    }

    return quotes;
  }

  async findById(rfqId: string, quoteId: string, companyId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, rfqId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
        company: { select: { id: true, name: true, slug: true, trustScore: true, responseRate: true, verificationLevel: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    if (rfq.companyId !== companyId && quote.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    if (rfq.companyId === companyId && quote.status === 'SUBMITTED') {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'VIEWED', isSeen: true, seenAt: new Date() },
      });
      await this.trackEvent(quoteId, companyId, 'QUOTE_VIEWED', { rfqId });
    }

    return quote;
  }

  async update(rfqId: string, quoteId: string, userId: string, dto: UpdateQuoteDto) {
    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'DRAFT') throw new BadRequestException('Only draft quotes can be edited');

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.subtotal !== undefined && { subtotal: dto.subtotal }),
        ...(dto.taxAmount !== undefined && { taxAmount: dto.taxAmount }),
        ...(dto.totalAmount !== undefined && { totalAmount: dto.totalAmount }),
        ...(dto.discountAmount !== undefined && { discountAmount: dto.discountAmount }),
        ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
        ...(dto.deliveryTerms !== undefined && { deliveryTerms: dto.deliveryTerms as any }),
        ...(dto.paymentTerms !== undefined && { paymentTerms: dto.paymentTerms as any }),
        ...(dto.leadTimeDays !== undefined && { leadTimeDays: dto.leadTimeDays }),
        ...(dto.leadTimeDisplay !== undefined && { leadTimeDisplay: dto.leadTimeDisplay }),
        ...(dto.validityDate !== undefined && { validityDate: new Date(dto.validityDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy: userId,
      },
      include: { lineItems: true, attachments: true },
    });

    return updated;
  }

  async submit(rfqId: string, quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'DRAFT') throw new BadRequestException('Only draft quotes can be submitted');

    const submitted = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SUBMITTED', submittedAt: new Date(), updatedBy: userId },
      include: { lineItems: true, attachments: true },
    });

    return submitted;
  }

  async withdraw(rfqId: string, quoteId: string, userId: string, reason?: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (!['DRAFT', 'SUBMITTED', 'VIEWED'].includes(quote.status)) {
      throw new BadRequestException('Quote cannot be withdrawn in current state');
    }

    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId }, select: { title: true, createdBy: true, companyId: true } });
    if (!rfq) throw new NotFoundException('RFQ not found');

    const withdrawn = await this.prisma.$transaction(async (tx) => {
      const w = await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'WITHDRAWN', withdrawnAt: new Date(), withdrawReason: reason ?? null, updatedBy: userId },
        include: { lineItems: true, attachments: true },
      });

      await tx.rfq.update({ where: { id: rfqId }, data: { quoteCount: { decrement: 1 } } });

      return w;
    });

    try {
      await this.notificationService.createWithTemplate(
        rfq.companyId,
        rfq.createdBy,
        NotificationType.QUOTE_WITHDRAWN,
        { rfqTitle: rfq.title },
      );
    } catch (err) {
      this.logger.error(`Failed to send QUOTE_WITHDRAWN notification: ${(err as Error).message}`);
    }

    return withdrawn;
  }

  async accept(rfqId: string, quoteId: string, companyId: string, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.companyId !== companyId) throw new ForbiddenException('Only the buyer can accept quotes');
    if (rfq.status !== 'ACTIVE') throw new BadRequestException('RFQ is not active');

    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SUBMITTED' && quote.status !== 'VIEWED') {
      throw new BadRequestException('Quote must be submitted to accept');
    }

    if (quote.validityDate && quote.validityDate < new Date()) {
      throw new BadRequestException('Quote has expired');
    }

    const rejectedQuotes = await this.prisma.quote.findMany({
      where: { rfqId, id: { not: quoteId }, status: { notIn: ['WITHDRAWN', 'REJECTED', 'EXPIRED'] } },
      select: { id: true, createdBy: true, companyId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.quote.updateMany({
        where: { rfqId, id: { not: quoteId }, status: { notIn: ['WITHDRAWN', 'REJECTED', 'EXPIRED'] } },
        data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: 'Another quote was accepted' },
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED', acceptedAt: new Date(), updatedBy: userId },
      });

      await tx.rfq.update({
        where: { id: rfqId },
        data: { status: 'QUOTED', acceptedQuoteId: quoteId },
      });
    });

    await this.trackEvent(quoteId, companyId, 'QUOTE_ACCEPTED', { rfqId });

    try {
      const buyerCompany = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
      await this.notificationService.createWithTemplate(
        quote.companyId,
        quote.createdBy,
        NotificationType.QUOTE_ACCEPTED,
        { rfqTitle: rfq.title, buyerName: buyerCompany?.name ?? 'Buyer' },
      );
    } catch (err) {
      this.logger.error(`Failed to send QUOTE_ACCEPTED notification: ${err.message}`);
    }

    for (const rq of rejectedQuotes) {
      try {
        await this.notificationService.createWithTemplate(
          rq.companyId,
          rq.createdBy,
          NotificationType.QUOTE_REJECTED,
          { rfqTitle: rfq.title },
        );
      } catch (err) {
        this.logger.error(`Failed to send QUOTE_REJECTED notification: ${err.message}`);
      }
    }

    return this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { lineItems: true, attachments: true, company: { select: { id: true, name: true, slug: true } } },
    });
  }

  async reject(rfqId: string, quoteId: string, companyId: string, userId: string, reason?: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.companyId !== companyId) throw new ForbiddenException('Only the buyer can reject quotes');

    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SUBMITTED' && quote.status !== 'VIEWED') {
      throw new BadRequestException('Quote must be submitted to reject');
    }

    const rejected = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason ?? null, updatedBy: userId },
      include: { lineItems: true, attachments: true },
    });

    await this.trackEvent(quoteId, companyId, 'QUOTE_REJECTED', { rfqId, reason });

    try {
      await this.notificationService.createWithTemplate(
        quote.companyId,
        quote.createdBy,
        NotificationType.QUOTE_REJECTED,
        { rfqTitle: rfq.title },
      );
    } catch (err) {
      this.logger.error(`Failed to send QUOTE_REJECTED notification: ${err.message}`);
    }

    return rejected;
  }

  async revise(rfqId: string, quoteId: string, userId: string, dto: ReviseQuoteDto) {
    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, rfqId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SUBMITTED' && quote.status !== 'VIEWED') {
      throw new BadRequestException('Only submitted quotes can be revised');
    }

    if (quote.quoteVersion >= MAX_REVISIONS + 1) {
      throw new BadRequestException(`Maximum ${MAX_REVISIONS} revisions reached`);
    }

    if (dto.validityDate) {
      const validityDate = new Date(dto.validityDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + MAX_VALIDITY_DAYS);
      if (validityDate > maxDate) throw new BadRequestException(`Validity cannot exceed ${MAX_VALIDITY_DAYS} days`);
    }

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        quoteVersion: { increment: 1 },
        revisionComment: dto.revisionComment ?? null,
        currency: dto.currency ?? quote.currency,
        subtotal: dto.subtotal ?? quote.subtotal,
        taxAmount: dto.taxAmount ?? quote.taxAmount,
        totalAmount: dto.totalAmount ?? quote.totalAmount,
        discountAmount: dto.discountAmount ?? quote.discountAmount,
        discountPercent: dto.discountPercent ?? quote.discountPercent,
        deliveryTerms: (dto.deliveryTerms as any) ?? quote.deliveryTerms,
        paymentTerms: (dto.paymentTerms as any) ?? quote.paymentTerms,
        leadTimeDays: dto.leadTimeDays ?? quote.leadTimeDays,
        leadTimeDisplay: dto.leadTimeDisplay ?? quote.leadTimeDisplay,
        validityDate: dto.validityDate ? new Date(dto.validityDate) : quote.validityDate,
        notes: dto.notes ?? quote.notes,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        updatedBy: userId,
        isSeen: false,
        seenAt: null,
      },
      include: { lineItems: true, attachments: true },
    });

    return updated;
  }

  async findMyQuotes(userId: string, page = 1, limit = 20) {
    const companies = await this.prisma.companyOwner.findMany({
      where: { userId, isPrimary: true },
      select: { companyId: true },
    });
    const companyIds = companies.map((c) => c.companyId);
    if (!companyIds.length) return { data: [], meta: { total: 0, page, limit, totalPages: 0, hasNext: false, hasPrevious: false } };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: { companyId: { in: companyIds } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lineItems: { orderBy: { sortOrder: 'asc' } },
          rfq: { select: { id: true, title: true, status: true } },
          company: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.quote.count({ where: { companyId: { in: companyIds } } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async findMyQuoteById(quoteId: string, userId: string) {
    const companies = await this.prisma.companyOwner.findMany({
      where: { userId, isPrimary: true },
      select: { companyId: true },
    });
    const companyIds = companies.map((c) => c.companyId);
    if (!companyIds.length) throw new NotFoundException('Quote not found');

    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, companyId: { in: companyIds } },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
        rfq: { select: { id: true, title: true, status: true, createdBy: true } },
        company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async getAdminOverview() {
    const [totalQuotes, byStatus] = await Promise.all([
      this.prisma.quote.count(),
      this.prisma.quote.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const stats: Record<string, number> = {};
    for (const s of byStatus) stats[s.status] = s._count.id;

    const submitted = stats['SUBMITTED'] || 0;
    const accepted = stats['ACCEPTED'] || 0;
    const conversionRate = submitted > 0 ? Math.round((accepted / submitted) * 1000) / 10 : 0;

    const avgResult = await this.prisma.quote.aggregate({
      _avg: { totalAmount: true },
    });

    return {
      totalQuotes,
      submitted,
      accepted: stats['ACCEPTED'] || 0,
      rejected: stats['REJECTED'] || 0,
      expired: stats['EXPIRED'] || 0,
      draft: stats['DRAFT'] || 0,
      withdrawn: stats['WITHDRAWN'] || 0,
      avgAmount: Math.round(Number(avgResult._avg.totalAmount ?? 0)),
      conversionRate,
    };
  }

  async expireOverdueQuotes() {
    const now = new Date();
    const [expired] = await Promise.all([
      this.prisma.quote.updateMany({
        where: { validityDate: { lte: now }, status: { in: ['SUBMITTED', 'VIEWED'] } },
        data: { status: 'EXPIRED' },
      }),
    ]);

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} overdue quotes`);

      const expiredQuotes = await this.prisma.quote.findMany({
        where: { validityDate: { lte: now }, status: 'EXPIRED', events: { none: { eventType: 'QUOTE_EXPIRED' } } },
        select: { id: true, companyId: true, rfqId: true, createdBy: true },
      });

      const rfqIds = [...new Set(expiredQuotes.map((q) => q.rfqId))];
      const rfqs = await this.prisma.rfq.findMany({
        where: { id: { in: rfqIds } },
        select: { id: true, title: true },
      });
      const rfqTitleMap = new Map(rfqs.map((r) => [r.id, r.title]));

      for (const q of expiredQuotes) {
        await this.trackEvent(q.id, q.companyId, 'QUOTE_EXPIRED', { rfqId: q.rfqId });

        try {
          await this.notificationService.createWithTemplate(
            q.companyId,
            q.createdBy,
            NotificationType.QUOTE_EXPIRED,
            { rfqTitle: rfqTitleMap.get(q.rfqId) ?? 'RFQ' },
          );
        } catch (err) {
          this.logger.error(`Failed to send QUOTE_EXPIRED notification: ${err.message}`);
        }
      }
    }

    return expired.count;
  }

  private rankQuotes(quotes: any[]) {
    if (!quotes.length) return [];

    const maxPrice = Math.max(...quotes.map((q) => Number(q.totalAmount ?? q.subtotal ?? 0)), 1);
    const maxLeadTime = Math.max(...quotes.map((q) => q.leadTimeDays ?? 365), 1);
    const maxTrust = Math.max(...quotes.map((q) => q.company?.trustScore ?? 0), 1);
    const maxRating = Math.max(...quotes.map((q) => q.company?.trustScore ?? 0), 1);
    const maxResponseTime = Math.max(...quotes.map((q) => q.company?.responseRate ?? 0), 1);

    const scored = quotes.map((q) => {
      const price = Number(q.totalAmount ?? q.subtotal ?? 0);
      const leadTime = q.leadTimeDays ?? 365;
      const trustScore = q.company?.trustScore ?? 0;
      const rating = q.company?.trustScore ?? 0;
      const responseRate = q.company?.responseRate ?? 0;

      const priceScore = maxPrice > 0 ? 1 - (price / maxPrice) : 0;
      const leadTimeScore = 1 - (leadTime / maxLeadTime);
      const trustScoreNorm = maxTrust > 0 ? trustScore / maxTrust : 0;
      const ratingNorm = maxRating > 0 ? rating / maxRating : 0;
      const responseScore = maxResponseTime > 0 ? responseRate / maxResponseTime : 0;

      const rankScore =
        priceScore * RANKING_WEIGHTS.price +
        leadTimeScore * RANKING_WEIGHTS.deliveryTime +
        trustScoreNorm * RANKING_WEIGHTS.trustScore +
        ratingNorm * RANKING_WEIGHTS.rating +
        responseScore * RANKING_WEIGHTS.responseTime;

      return { ...q, rankScore };
    });

    scored.sort((a: any, b: any) => b.rankScore - a.rankScore);

    return scored.map((q: any, i: number) => ({ ...q, rank: i + 1 }));
  }

  private async trackEvent(quoteId: string, companyId: string, eventType: string, metadata?: Record<string, unknown>) {
    await this.prisma.quoteEvent.create({
      data: {
        quoteId,
        companyId,
        eventType: eventType as any,
        metadata: (metadata ?? undefined) as any,
      },
    }).catch((err: any) => {
      this.logger.error(`Failed to track quote event ${eventType}: ${err.message}`);
    });
  }
}
