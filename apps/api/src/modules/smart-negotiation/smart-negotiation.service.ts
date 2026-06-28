import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, NegotiationStatus, NegotiationEventType } from '@prisma/client';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { PaginationDto, buildPaginationQuery, buildPaginatedResult } from '../../common/dto/pagination.dto';

const NEGOTIATION_FIELDS = [
  'proposedPrice', 'proposedMoq', 'proposedLeadTimeDays', 'proposedDeliveryTerms',
  'proposedPaymentTerms', 'proposedDiscountPercent', 'proposedWarranty', 'proposedFreight', 'proposedValidityDate',
] as const;

@Injectable()
export class SmartNegotiationService {
  private readonly logger = new Logger(SmartNegotiationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getUserCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('User has no company');
    return owner.company;
  }

  async start(quoteId: string, userId: string, dto?: { notes?: string }) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true, lineItems: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'SUBMITTED' && quote.status !== 'VIEWED') {
      throw new BadRequestException('Quote must be SUBMITTED or VIEWED to negotiate');
    }

    const company = await this.getUserCompany(userId);
    const isBuyer = quote.rfq.companyId === company.id;
    const isSeller = quote.companyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized for this quote');

    const existing = await this.prisma.negotiation.findUnique({ where: { quoteId } });
    if (existing) throw new BadRequestException('Negotiation already exists for this quote');

    const negotiation = await this.prisma.$transaction(async (tx) => {
      const n = await tx.negotiation.create({
        data: {
          quoteId,
          rfqId: quote.rfqId,
          buyerCompanyId: quote.rfq.companyId,
          sellerCompanyId: quote.companyId,
          status: 'NEGOTIATION_STARTED',
          proposedPrice: quote.totalAmount,
          proposedMoq: quote.lineItems[0]?.quantity || undefined,
          proposedLeadTimeDays: quote.leadTimeDays || undefined,
          proposedDeliveryTerms: quote.deliveryTerms as any,
          proposedPaymentTerms: quote.paymentTerms as any,
          notes: dto?.notes,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.negotiationVersion.create({
        data: {
          negotiationId: n.id,
          version: 1,
          proposedBy: isBuyer ? 'BUYER' : 'SELLER',
          proposedByUserId: userId,
          proposedPrice: quote.totalAmount,
          proposedMoq: quote.lineItems[0]?.quantity || undefined,
          proposedLeadTimeDays: quote.leadTimeDays || undefined,
          proposedDeliveryTerms: quote.deliveryTerms,
          proposedPaymentTerms: quote.paymentTerms,
          changedFields: ['proposedPrice', 'proposedLeadTimeDays', 'proposedDeliveryTerms', 'proposedPaymentTerms'],
          metadata: { sourceQuoteVersion: quote.quoteVersion },
        },
      });

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'NEGOTIATING' as any },
      });

      await tx.negotiationEvent.create({
        data: {
          negotiationId: n.id,
          eventType: 'NEGOTIATION_STARTED',
          actorId: userId,
          actorRole: isBuyer ? 'BUYER' : 'SELLER',
          metadata: { quoteVersion: quote.quoteVersion },
        },
      });

      return n;
    });

    const targetCompanyId = isBuyer ? quote.companyId : quote.rfq.companyId;
    await this.notificationService.createWithTemplate(targetCompanyId, undefined, 'NEGOTIATION_STARTED' as NotificationType, {
      negotiationId: negotiation.id,
      quoteId,
      rfqId: quote.rfqId,
    });

    return this.findById(negotiation.id, userId);
  }

  async counter(negotiationId: string, userId: string, dto: CounterOfferDto) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { quote: { include: { rfq: true } } },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = negotiation.buyerCompanyId === company.id;
    const isSeller = negotiation.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    const validStatuses: NegotiationStatus[] = ['NEGOTIATION_STARTED', 'BUYER_COUNTER', 'SELLER_COUNTER', 'PENDING'];
    if (!validStatuses.includes(negotiation.status)) {
      throw new BadRequestException(`Cannot counter in status ${negotiation.status}`);
    }

    const changedFields: string[] = [];
    const updateData: Record<string, any> = {};
    for (const field of NEGOTIATION_FIELDS) {
      if (dto[field] !== undefined) {
        (updateData as any)[field] = dto[field];
        changedFields.push(field);
      }
    }
    if (changedFields.length === 0) throw new BadRequestException('No fields to update');

    updateData.status = isBuyer ? 'BUYER_COUNTER' : 'SELLER_COUNTER';
    updateData.notes = dto.notes || undefined;
    updateData.updatedBy = userId;

    const latestVersion = await this.prisma.negotiationVersion.findFirst({
      where: { negotiationId },
      orderBy: { version: 'desc' },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiationId },
        data: updateData,
      });

      await tx.negotiationVersion.create({
        data: {
          negotiationId,
          version: (latestVersion?.version || 0) + 1,
          proposedBy: isBuyer ? 'BUYER' : 'SELLER',
          proposedByUserId: userId,
          proposedPrice: dto.proposedPrice ?? undefined,
          proposedMoq: dto.proposedMoq ?? undefined,
          proposedLeadTimeDays: dto.proposedLeadTimeDays ?? undefined,
          proposedDeliveryTerms: dto.proposedDeliveryTerms ?? undefined,
          proposedPaymentTerms: dto.proposedPaymentTerms ?? undefined,
          proposedDiscountPercent: dto.proposedDiscountPercent ?? undefined,
          proposedWarranty: dto.proposedWarranty ?? undefined,
          proposedFreight: dto.proposedFreight ?? undefined,
          proposedValidityDate: dto.proposedValidityDate ? new Date(dto.proposedValidityDate) : undefined,
          notes: dto.notes,
          changedFields,
        },
      });

      await tx.negotiationEvent.create({
        data: {
          negotiationId,
          eventType: (isBuyer ? 'BUYER_COUNTER' : 'SELLER_COUNTER') as NegotiationEventType,
          actorId: userId,
          actorRole: isBuyer ? 'BUYER' : 'SELLER',
          metadata: { changedFields, version: (latestVersion?.version || 0) + 1 },
        },
      });
    });

    const targetCompanyId = isBuyer ? negotiation.sellerCompanyId : negotiation.buyerCompanyId;
    await this.notificationService.createWithTemplate(targetCompanyId, undefined, 'COUNTER_OFFER' as NotificationType, {
      negotiationId,
      quoteId: negotiation.quoteId,
      changedFields,
    });

    return this.findById(negotiationId, userId);
  }

  async accept(negotiationId: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { quote: { include: { rfq: true } } },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = negotiation.buyerCompanyId === company.id;
    const isSeller = negotiation.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    if (!['NEGOTIATION_STARTED', 'BUYER_COUNTER', 'SELLER_COUNTER', 'PENDING'].includes(negotiation.status)) {
      throw new BadRequestException(`Cannot accept in status ${negotiation.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedBy: userId,
          updatedBy: userId,
        },
      });

      await tx.quote.update({
        where: { id: negotiation.quoteId },
        data: { status: 'ACCEPTED' as any, acceptedAt: new Date() },
      });

      await tx.negotiationEvent.create({
        data: {
          negotiationId,
          eventType: (isBuyer ? 'BUYER_ACCEPTED' : 'SELLER_ACCEPTED') as NegotiationEventType,
          actorId: userId,
          actorRole: isBuyer ? 'BUYER' : 'SELLER',
        },
      });
    });

    const targetCompanyId = isBuyer ? negotiation.sellerCompanyId : negotiation.buyerCompanyId;
    await this.notificationService.createWithTemplate(targetCompanyId, undefined, 'NEGOTIATION_ACCEPTED' as NotificationType, {
      negotiationId,
      quoteId: negotiation.quoteId,
    });

    return this.findById(negotiationId, userId);
  }

  async reject(negotiationId: string, userId: string, reason?: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { quote: { include: { rfq: true } } },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = negotiation.buyerCompanyId === company.id;
    const isSeller = negotiation.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    if (['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED'].includes(negotiation.status)) {
      throw new BadRequestException(`Cannot reject in status ${negotiation.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: userId,
          rejectionReason: reason,
          updatedBy: userId,
        },
      });

      await tx.negotiationEvent.create({
        data: {
          negotiationId,
          eventType: (isBuyer ? 'BUYER_REJECTED' : 'SELLER_REJECTED') as NegotiationEventType,
          actorId: userId,
          actorRole: isBuyer ? 'BUYER' : 'SELLER',
          metadata: { reason },
        },
      });
    });

    const targetCompanyId = isBuyer ? negotiation.sellerCompanyId : negotiation.buyerCompanyId;
    await this.notificationService.createWithTemplate(targetCompanyId, undefined, 'NEGOTIATION_REJECTED' as NotificationType, {
      negotiationId,
      quoteId: negotiation.quoteId,
      reason,
    });

    return this.findById(negotiationId, userId);
  }

  async cancel(negotiationId: string, userId: string, reason?: string) {
    const negotiation = await this.prisma.negotiation.findUnique({ where: { id: negotiationId } });
    if (!negotiation) throw new NotFoundException('Negotiation not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = negotiation.buyerCompanyId === company.id;
    const isSeller = negotiation.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    if (['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED'].includes(negotiation.status)) {
      throw new BadRequestException(`Cannot cancel in status ${negotiation.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiationId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelReason: reason,
          updatedBy: userId,
        },
      });

      await tx.negotiationEvent.create({
        data: {
          negotiationId,
          eventType: 'NEGOTIATION_CANCELLED' as NegotiationEventType,
          actorId: userId,
          actorRole: isBuyer ? 'BUYER' : 'SELLER',
          metadata: { reason },
        },
      });
    });

    return this.findById(negotiationId, userId);
  }

  async findAll(userId: string, status?: string, pagination?: PaginationDto) {
    const company = await this.getUserCompany(userId);
    const where: any = {
      OR: [
        { buyerCompanyId: company.id },
        { sellerCompanyId: company.id },
      ],
    };
    if (status) where.status = status;

    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.negotiation.findMany({
        where,
        include: {
          quote: { select: { id: true, totalAmount: true, currency: true, status: true } },
          rfq: { select: { id: true, title: true, rfqNumber: true } },
          buyerCompany: { select: { id: true, name: true, slug: true, trustScore: true } },
          sellerCompany: { select: { id: true, name: true, slug: true, trustScore: true } },
          versions: { orderBy: { version: 'desc' }, take: 1 },
          _count: { select: { versions: true, events: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.negotiation.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async findById(negotiationId: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        quote: {
          include: {
            lineItems: true,
            company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true } },
          },
        },
        rfq: { select: { id: true, title: true, rfqNumber: true, status: true } },
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true } },
        sellerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true } },
        versions: { orderBy: { version: 'asc' } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');
    return negotiation;
  }

  async getVersions(negotiationId: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({ where: { id: negotiationId } });
    if (!negotiation) throw new NotFoundException('Negotiation not found');
    return this.prisma.negotiationVersion.findMany({
      where: { negotiationId },
      orderBy: { version: 'asc' },
    });
  }

  async getTimeline(negotiationId: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({ where: { id: negotiationId } });
    if (!negotiation) throw new NotFoundException('Negotiation not found');
    return this.prisma.negotiationEvent.findMany({
      where: { negotiationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  async getAdminOverview() {
    const [total, byStatus, totalVersions, totalEvents] = await Promise.all([
      this.prisma.negotiation.count(),
      this.prisma.negotiation.groupBy({ by: ['status'], _count: true }),
      this.prisma.negotiationVersion.count(),
      this.prisma.negotiationEvent.count(),
    ]);
    return { total, byStatus, totalVersions, totalEvents };
  }

  async getAdminNegotiations(status?: string, pagination?: PaginationDto) {
    const where: any = {};
    if (status) where.status = status;
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.negotiation.findMany({
        where,
        include: {
          quote: { select: { id: true, totalAmount: true, currency: true } },
          rfq: { select: { id: true, title: true } },
          buyerCompany: { select: { id: true, name: true } },
          sellerCompany: { select: { id: true, name: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.negotiation.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getAdminFlagged(pagination?: PaginationDto) {
    const where = { status: { in: ['REJECTED', 'CANCELLED'] as any } };
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.negotiation.findMany({
        where,
        include: {
          quote: { select: { id: true, totalAmount: true } },
          rfq: { select: { id: true, title: true } },
          buyerCompany: { select: { id: true, name: true } },
          sellerCompany: { select: { id: true, name: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.negotiation.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getAdminAudit(pagination?: PaginationDto) {
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.negotiationEvent.findMany({
        include: { negotiation: { select: { id: true } } },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.negotiationEvent.count(),
    ]);
    return buildPaginatedResult(data, total, query);
  }
}
