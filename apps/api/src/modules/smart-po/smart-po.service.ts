import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { UpdatePoDto } from './dto/update-po.dto';
import { PoPdfService } from './po-pdf.service';
import { PaginationDto, buildPaginationQuery, buildPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SmartPoService {
  private readonly logger = new Logger(SmartPoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly poPdfService: PoPdfService,
  ) {}

  async getUserCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new NotFoundException('User has no company');
    return owner.company;
  }

  private async generatePoNumber(): Promise<string> {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(10000 + Math.random() * 90000);
    const prefix = `PO-${datePart}-${random}`;
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { poNumber: prefix } });
    if (existing) return this.generatePoNumber();
    return prefix;
  }

  async generate(negotiationId: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        quote: { include: { lineItems: true, company: true } },
        rfq: { select: { id: true, companyId: true } },
      },
    });
    if (!negotiation) throw new NotFoundException('Negotiation not found');
    if (negotiation.status !== 'ACCEPTED') throw new BadRequestException('Negotiation must be ACCEPTED');

    const company = await this.getUserCompany(userId);
    const isBuyer = negotiation.buyerCompanyId === company.id;
    if (!isBuyer) throw new ForbiddenException('Only the buyer can generate a purchase order');

    const existing = await this.prisma.purchaseOrder.findUnique({ where: { negotiationId } });
    if (existing) throw new BadRequestException('Purchase order already exists for this negotiation');

    const quote = negotiation.quote;
    const poNumber = await this.generatePoNumber();

    const po = await this.prisma.$transaction(async (tx) => {
      const p = await tx.purchaseOrder.create({
        data: {
          poNumber,
          negotiationId,
          quoteId: quote.id,
          rfqId: negotiation.rfqId,
          buyerCompanyId: negotiation.buyerCompanyId,
          sellerCompanyId: negotiation.sellerCompanyId,
          status: 'DRAFT',
          currency: quote.currency || 'INR',
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          discountAmount: quote.discountAmount,
          discountPercent: quote.discountPercent,
          deliveryTerms: quote.deliveryTerms as any,
          paymentTerms: quote.paymentTerms as any,
          leadTimeDays: quote.leadTimeDays,
          leadTimeDisplay: quote.leadTimeDisplay,
          validityDate: quote.validityDate,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (quote.lineItems?.length) {
        await tx.purchaseOrderLineItem.createMany({
          data: quote.lineItems.map((li, i) => ({
            purchaseOrderId: p.id,
            productName: li.productName,
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.totalPrice,
            deliveryTerms: li.deliveryTerms,
            leadTimeDays: li.leadTimeDays,
            notes: li.notes,
            sortOrder: i,
          })),
        });
      }

      await tx.purchaseOrderVersion.create({
        data: {
          purchaseOrderId: p.id,
          version: 1,
          status: 'DRAFT',
          data: p as any,
          createdBy: userId,
          notes: 'Generated from accepted negotiation',
        },
      });

      await tx.purchaseOrderEvent.create({
        data: {
          purchaseOrderId: p.id,
          eventType: 'PO_GENERATED',
          actorId: userId,
          actorRole: 'BUYER',
          metadata: { negotiationId, poNumber },
        },
      });

      return p;
    });

    await this.notificationService.createWithTemplate(negotiation.sellerCompanyId, undefined, 'PO_GENERATED' as NotificationType, {
      poNumber,
      purchaseOrderId: po.id,
      negotiationId,
    });

    return this.findById(po.id, userId);
  }

  async confirm(poId: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT can be confirmed');

    const company = await this.getUserCompany(userId);
    if (po.buyerCompanyId !== company.id) throw new ForbiddenException('Only the buyer can confirm');

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'BUYER_CONFIRMED', buyerConfirmedAt: new Date(), updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'BUYER_CONFIRMED', userId);
      await this.trackEvent(tx, poId, 'PO_CONFIRMED', userId, 'BUYER');
    });

    await this.notificationService.createWithTemplate(po.sellerCompanyId, undefined, 'PO_CONFIRMED' as NotificationType, {
      poNumber: po.poNumber,
      purchaseOrderId: poId,
    });

    return this.findById(poId, userId);
  }

  async markSellerPending(poId: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'BUYER_CONFIRMED') throw new BadRequestException('PO must be buyer confirmed');

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'SELLER_PENDING', sellerPendingAt: new Date(), updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'SELLER_PENDING', userId);
      await this.trackEvent(tx, poId, 'PO_SELLER_PENDING', userId, 'SYSTEM');
    });

    return this.findById(poId, userId);
  }

  async accept(poId: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'SELLER_PENDING') throw new BadRequestException('PO must be in seller pending status');

    const company = await this.getUserCompany(userId);
    if (po.sellerCompanyId !== company.id) throw new ForbiddenException('Only the seller can accept');

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'SELLER_ACCEPTED', sellerAcceptedAt: new Date(), updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'SELLER_ACCEPTED', userId);
      await this.trackEvent(tx, poId, 'PO_SELLER_ACCEPTED', userId, 'SELLER');
    });

    await this.notificationService.createWithTemplate(po.buyerCompanyId, undefined, 'PO_SELLER_ACCEPTED' as NotificationType, {
      poNumber: po.poNumber,
      purchaseOrderId: poId,
    });

    return this.findById(poId, userId);
  }

  async reject(poId: string, userId: string, reason?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = po.buyerCompanyId === company.id;
    const isSeller = po.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    if (['REJECTED', 'CANCELLED', 'EXPIRED', 'LOCKED', 'CONVERTED_TO_ORDER'].includes(po.status)) {
      throw new BadRequestException(`Cannot reject in status ${po.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason, updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'REJECTED', userId, reason);
      await this.trackEvent(tx, poId, 'PO_REJECTED', userId, isBuyer ? 'BUYER' : 'SELLER', { reason });
    });

    return this.findById(poId, userId);
  }

  async cancel(poId: string, userId: string, reason?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = po.buyerCompanyId === company.id;
    const isSeller = po.sellerCompanyId === company.id;
    if (!isBuyer && !isSeller) throw new ForbiddenException('Not authorized');

    if (['REJECTED', 'CANCELLED', 'EXPIRED', 'LOCKED', 'CONVERTED_TO_ORDER'].includes(po.status)) {
      throw new BadRequestException(`Cannot cancel in status ${po.status}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason, updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'CANCELLED', userId, reason);
      await this.trackEvent(tx, poId, 'PO_CANCELLED', userId, isBuyer ? 'BUYER' : 'SELLER', { reason });
    });

    return this.findById(poId, userId);
  }

  async requestRevision(poId: string, userId: string, notes: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'SELLER_PENDING') throw new BadRequestException('Only seller pending POs can request revision');

    const company = await this.getUserCompany(userId);
    if (po.sellerCompanyId !== company.id) throw new ForbiddenException('Only the seller can request revision');

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'DRAFT', updatedBy: userId },
      });

      await this.trackVersion(tx, poId, 'DRAFT', userId, notes);
      await this.trackEvent(tx, poId, 'PO_REVISION_REQUESTED', userId, 'SELLER', { notes });
    });

    return this.findById(poId, userId);
  }

  async revise(poId: string, userId: string, dto: UpdatePoDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const company = await this.getUserCompany(userId);
    const isBuyer = po.buyerCompanyId === company.id;
    if (!isBuyer) throw new ForbiddenException('Only the buyer can revise the PO');

    const updateData: Record<string, any> = {
      currency: dto.currency,
      subtotal: dto.subtotal,
      taxAmount: dto.taxAmount,
      totalAmount: dto.totalAmount,
      discountAmount: dto.discountAmount,
      discountPercent: dto.discountPercent,
      deliveryTerms: dto.deliveryTerms as any,
      paymentTerms: dto.paymentTerms as any,
      leadTimeDays: dto.leadTimeDays,
      leadTimeDisplay: dto.leadTimeDisplay,
      validityDate: dto.validityDate ? new Date(dto.validityDate) : undefined,
      warranty: dto.warranty,
      freight: dto.freight,
      packing: dto.packing,
      specialConditions: dto.specialConditions,
      commercialNotes: dto.commercialNotes,
      gstType: dto.gstType,
      gstRate: dto.gstRate,
      updatedBy: userId,
    };
    Object.keys(updateData).forEach((k) => { if (updateData[k] === undefined) delete updateData[k]; });

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({ where: { id: poId }, data: updateData });

      if (dto.lineItems?.length) {
        await tx.purchaseOrderLineItem.deleteMany({ where: { purchaseOrderId: poId } });
        await tx.purchaseOrderLineItem.createMany({
          data: dto.lineItems.map((li, i) => ({
            purchaseOrderId: poId,
            productName: li.productName,
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.totalPrice,
            gstRate: li.gstRate,
            gstAmount: li.gstAmount,
            deliveryTerms: li.deliveryTerms,
            leadTimeDays: li.leadTimeDays,
            notes: li.notes,
            sortOrder: i,
          })),
        });
      }

      const latestVersion = await tx.purchaseOrderVersion.findFirst({
        where: { purchaseOrderId: poId }, orderBy: { version: 'desc' },
      });
      const updated = await tx.purchaseOrder.findUnique({ where: { id: poId } });
      await tx.purchaseOrderVersion.create({
        data: {
          purchaseOrderId: poId,
          version: (latestVersion?.version || 0) + 1,
          status: po.status as any,
          data: updated as any,
          changedFields: dto.revisionNotes ? [] : undefined,
          createdBy: userId,
          notes: dto.revisionNotes,
        },
      });
      await this.trackEvent(tx, poId, 'PO_REVISED', userId, 'BUYER', { revisionNotes: dto.revisionNotes });
    });

    return this.findById(poId, userId);
  }

  async lock(poId: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'SELLER_ACCEPTED') throw new BadRequestException('PO must be seller accepted to lock');

    const company = await this.getUserCompany(userId);
    const isBuyer = po.buyerCompanyId === company.id;
    if (!isBuyer) throw new ForbiddenException('Only the buyer can lock the PO');

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'LOCKED', lockedAt: new Date(), updatedBy: userId },
      });
      await this.trackVersion(tx, poId, 'LOCKED', userId);
      await this.trackEvent(tx, poId, 'PO_LOCKED', userId, 'BUYER');
    });

    return this.findById(poId, userId);
  }

  async findAll(userId: string, status?: string, pagination?: PaginationDto) {
    const company = await this.getUserCompany(userId);
    const where: any = {
      OR: [{ buyerCompanyId: company.id }, { sellerCompanyId: company.id }],
    };
    if (status) where.status = status;

    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          buyerCompany: { select: { id: true, name: true, slug: true } },
          sellerCompany: { select: { id: true, name: true, slug: true } },
          _count: { select: { versions: true, lineItems: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async findById(poId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, gstNumber: true } },
        sellerCompany: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, gstNumber: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
        versions: { orderBy: { version: 'asc' } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async getVersions(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrderVersion.findMany({
      where: { purchaseOrderId: poId },
      orderBy: { version: 'asc' },
    });
  }

  async getTimeline(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.prisma.purchaseOrderEvent.findMany({
      where: { purchaseOrderId: poId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPdfHtml(poId: string) {
    const po = await this.findById(poId);
    return this.poPdfService.generateHtml(po);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────

  async getAdminOverview() {
    const [total, byStatus, totalVersions, totalEvents] = await Promise.all([
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.groupBy({ by: ['status'], _count: true }),
      this.prisma.purchaseOrderVersion.count(),
      this.prisma.purchaseOrderEvent.count(),
    ]);
    return { total, byStatus, totalVersions, totalEvents };
  }

  async getAdminPos(status?: string, pagination?: PaginationDto) {
    const where: any = {};
    if (status) where.status = status;
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          buyerCompany: { select: { id: true, name: true } },
          sellerCompany: { select: { id: true, name: true } },
          _count: { select: { versions: true, lineItems: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getAdminFlagged(pagination?: PaginationDto) {
    const where = { status: { in: ['REJECTED', 'CANCELLED', 'EXPIRED'] } };
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: where as any,
        include: {
          buyerCompany: { select: { id: true, name: true } },
          sellerCompany: { select: { id: true, name: true } },
        },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.purchaseOrder.count({ where: where as any }),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  async getAdminAudit(pagination?: PaginationDto) {
    const query = buildPaginationQuery(pagination || new PaginationDto());
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrderEvent.findMany({
        include: { purchaseOrder: { select: { poNumber: true } } },
        orderBy: { [query.sort]: query.order } as any,
        take: query.limit,
        skip: query.skip,
      }),
      this.prisma.purchaseOrderEvent.count(),
    ]);
    return buildPaginatedResult(data, total, query);
  }

  // ─── HELPERS ────────────────────────────────────────────────────────

  private async trackVersion(tx: any, poId: string, status: string, userId: string, notes?: string) {
    const latest = await tx.purchaseOrderVersion.findFirst({
      where: { purchaseOrderId: poId }, orderBy: { version: 'desc' },
    });
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    await tx.purchaseOrderVersion.create({
      data: {
        purchaseOrderId: poId,
        version: (latest?.version || 0) + 1,
        status: status as any,
        data: po as any,
        createdBy: userId,
        notes,
      },
    });
  }

  private async trackEvent(tx: any, poId: string, eventType: string, actorId: string, actorRole: string, metadata?: any) {
    await tx.purchaseOrderEvent.create({
      data: {
        purchaseOrderId: poId,
        eventType: eventType as any,
        actorId,
        actorRole,
        metadata: metadata || undefined,
      },
    });
  }
}
