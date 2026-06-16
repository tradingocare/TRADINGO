import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { RfqQueryDto } from './dto/rfq-query.dto';
import { RfqSearchDto } from './dto/rfq-search.dto';
import { RfqNumberService, stateToCode } from './rfq-number.service';
import { RfqAnalyticsService } from './rfq-analytics.service';
import { RfqType, NotificationType } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

const CREDITS_PER_RFQ: Record<RfqType, number> = {
  PRODUCT: 1,
  SERVICE: 1,
  BULK: 3,
  URGENT: 5,
};

const FREE_TIER_MONTHLY_LIMIT = 5;
const REOPEN_WINDOW_DAYS = 7;
const CREDIT_PACK_PRICE = 999;
const CREDIT_PACK_CREDITS = 5;

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rfqNumberService: RfqNumberService,
    private readonly rfqAnalytics: RfqAnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(companyId: string, dto: CreateRfqDto, userId: string) {
    await this.enforceBuyerPlanLimit(companyId);

    const rfq = await this.prisma.rfq.create({
      data: {
        companyId,
        userId,
        title: dto.title,
        description: dto.description,
        rfqType: dto.rfqType,
        visibility: dto.visibility ?? 'PUBLIC',
        urgency: dto.urgency ?? 'NORMAL',
        status: 'DRAFT',
        budgetMin: dto.budgetMin ?? undefined,
        budgetMax: dto.budgetMax ?? undefined,
        showBudget: dto.showBudget ?? false,
        currency: dto.currency ?? 'INR',
        quantity: dto.quantity,
        unit: dto.unit,
        preferredLocation: dto.preferredLocation,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        categoryId: dto.categoryId,
        industryId: dto.industryId,
        createdBy: userId,
        updatedBy: userId,
        locations: dto.locations?.length
          ? { create: dto.locations.map((l) => ({ city: l.city, state: l.state, country: l.country ?? 'India', pincode: l.pincode, isPrimary: l.isPrimary ?? false })) }
          : undefined,
        attachments: dto.attachments?.length
          ? { create: dto.attachments.map((a) => ({ type: a.type as any, url: a.url, originalName: a.originalName, mimeType: a.mimeType, fileSize: a.fileSize })) }
          : undefined,
        productItems: dto.productItems?.length
          ? { create: dto.productItems.map((p) => ({ categoryId: p.categoryId, productName: p.productName, description: p.description, quantity: p.quantity, unit: p.unit, targetPrice: p.targetPrice, isService: p.isService ?? false })) }
          : undefined,
      },
      include: { locations: true, attachments: true, productItems: true },
    });

    const primaryLocation = dto.locations?.find((l) => l.isPrimary) || dto.locations?.[0];
    const stateCode = stateToCode(primaryLocation?.state ?? null);
    const rfqNumber = await this.rfqNumberService.generate(stateCode);

    await this.prisma.rfq.update({
      where: { id: rfq.id },
      data: { rfqNumber, stateCode },
    });

    await this.rfqAnalytics.trackEvent(companyId, rfq.id, 'CREATED', { rfqType: dto.rfqType });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CREATE_RFQ', resource: `rfq:${rfq.id}`, metadata: { companyId, rfqType: dto.rfqType, rfqNumber } },
    });

    await this.notificationService.createWithTemplate(
      rfq.companyId,
      rfq.createdBy,
      NotificationType.RFQ_CREATED,
      { rfqTitle: rfq.title },
    );

    return { ...rfq, rfqNumber, stateCode };
  }

  async findAll(companyId: string, query: RfqQueryDto) {
    const { status, rfqType, page = 1, limit = 20 } = query;
    const where: any = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (rfqType) where.rfqType = rfqType;

    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { locations: true, productItems: { take: 5 }, _count: { select: { quotes: true } } },
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async search(companyId: string, query: RfqSearchDto) {
    const { rfqNumber, title, categoryId, status, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const where: any = { companyId, deletedAt: null };
    if (rfqNumber) where.rfqNumber = { contains: rfqNumber, mode: 'insensitive' };
    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { locations: true, productItems: { take: 5 }, _count: { select: { quotes: true } } },
      }),
      this.prisma.rfq.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const rfq = await this.prisma.rfq.findFirst({
      where: { id, deletedAt: null },
      include: { locations: true, attachments: true, productItems: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async update(id: string, dto: UpdateRfqDto, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'DRAFT' && rfq.status !== 'EXPIRED' && dto.status !== 'CANCELLED') {
      throw new BadRequestException('Only draft or expired RFQs can be edited');
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.rfqType !== undefined && { rfqType: dto.rfqType }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.urgency !== undefined && { urgency: dto.urgency }),
        ...(dto.status !== undefined && { status: dto.status, ...(dto.status === 'CANCELLED' && { cancelledAt: new Date(), cancelReason: 'User cancelled' }) }),
        ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
        ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
        ...(dto.showBudget !== undefined && { showBudget: dto.showBudget }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.preferredLocation !== undefined && { preferredLocation: dto.preferredLocation }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.industryId !== undefined && { industryId: dto.industryId }),
        updatedBy: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'UPDATE_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId, changes: { ...dto } } },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'DRAFT' && rfq.status !== 'CANCELLED') {
      throw new BadRequestException('Only draft or cancelled RFQs can be deleted');
    }

    await this.prisma.rfq.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED', updatedBy: userId, cancelledAt: new Date(), cancelReason: 'Deleted by user' },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'DELETE_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId } },
    });
  }

  async publish(id: string, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'DRAFT') throw new BadRequestException('Only draft RFQs can be published');

    const creditsNeeded = CREDITS_PER_RFQ[rfq.rfqType] || 1;
    await this.deductCredits(rfq.companyId, creditsNeeded, id);

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: { status: 'ACTIVE', updatedBy: userId },
    });

    await this.rfqAnalytics.trackEvent(rfq.companyId, id, 'PUBLISHED', { creditsUsed: creditsNeeded });

    await this.prisma.auditLog.create({
      data: { userId, action: 'PUBLISH_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId, creditsUsed: creditsNeeded } },
    });

    return updated;
  }

  async close(id: string, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'ACTIVE' && rfq.status !== 'QUOTED' && rfq.status !== 'NEGOTIATING') {
      throw new BadRequestException('Only active, quoted, or negotiating RFQs can be closed');
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedBy: userId, updatedBy: userId },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CLOSE_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId } },
    });

    await this.notificationService.createWithTemplate(
      rfq.companyId,
      rfq.createdBy,
      NotificationType.RFQ_CLOSED,
      { rfqTitle: rfq.title },
    );

    return updated;
  }

  async reopen(id: string, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'CLOSED') {
      throw new BadRequestException('Only closed RFQs can be reopened');
    }
    if (rfq.reopenCount >= 1) {
      throw new BadRequestException('RFQ can only be reopened once');
    }

    const daysSinceClose = Math.floor((Date.now() - new Date(rfq.closedAt!).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceClose > REOPEN_WINDOW_DAYS) {
      throw new BadRequestException(`RFQ can only be reopened within ${REOPEN_WINDOW_DAYS} days of closing`);
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        reopenedAt: new Date(),
        reopenCount: { increment: 1 },
        closedAt: null,
        closedBy: null,
        updatedBy: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'REOPEN_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId } },
    });

    await this.notificationService.createWithTemplate(
      rfq.companyId,
      rfq.createdBy,
      NotificationType.RFQ_REOPENED,
      { rfqTitle: rfq.title },
    );

    return updated;
  }

  async cancel(id: string, reason: string | undefined, userId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status === 'CANCELLED' || rfq.status === 'CLOSED' || rfq.status === 'CONVERTED') {
      throw new BadRequestException(`RFQ is already ${rfq.status}`);
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason || 'Cancelled by user', updatedBy: userId },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CANCEL_RFQ', resource: `rfq:${id}`, metadata: { companyId: rfq.companyId, reason } },
    });

    return updated;
  }

  async purchaseCreditPack(companyId: string, _userId: string) {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const pack = await this.prisma.rfqCreditPack.create({
      data: {
        companyId,
        name: 'RFQ Credit Pack',
        credits: CREDIT_PACK_CREDITS,
        price: CREDIT_PACK_PRICE,
        currency: 'INR',
        validityDays: 0,
        isActive: false,
        expiresAt: endOfMonth,
      },
    });

    await this.notificationService.createWithTemplate(
      companyId,
      _userId,
      NotificationType.CREDIT_PACK_PURCHASED,
      { credits: CREDIT_PACK_CREDITS, amount: CREDIT_PACK_PRICE },
    );

    return {
      id: pack.id,
      credits: pack.credits,
      amount: Number(pack.price) * 100,
      currency: pack.currency,
      description: `RFQ Credit Pack — ${CREDIT_PACK_CREDITS} credits for ₹${CREDIT_PACK_PRICE}`,
    };
  }

  async getCreditBalance(companyId: string): Promise<number> {
    return this.computeCreditBalance(companyId, this.prisma);
  }

  async adminGrantCredits(companyId: string, amount: number, userId: string) {
    const balanceBefore = await this.getCreditBalance(companyId);

    await this.prisma.rfqCreditLedger.create({
      data: {
        companyId,
        type: 'ADMIN_CREDIT',
        amount,
        balanceBefore,
        balanceAfter: balanceBefore + amount,
        description: `Admin grant by ${userId}`,
      },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'GRANT_RFQ_CREDITS', resource: `company:${companyId}`, metadata: { amount } },
    });
  }

  private async enforceBuyerPlanLimit(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionPlan: true },
    });

    if (!company) return;

    if (company.subscriptionPlan === 'TRADBUY') return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyCount = await this.prisma.rfq.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        deletedAt: null,
      },
    });

    if (monthlyCount >= FREE_TIER_MONTHLY_LIMIT) {
      throw new ForbiddenException(`Free tier limit of ${FREE_TIER_MONTHLY_LIMIT} RFQs per month reached. Subscribe to TRADBUY for unlimited RFQs.`);
    }
  }

  private async computeCreditBalance(companyId: string, tx: any): Promise<number> {
    const result = await tx.rfqCreditLedger.groupBy({
      by: ['type'],
      where: { companyId },
      _sum: { amount: true },
    });

    let balance = 0;
    for (const row of result) {
      if (row.type === 'PURCHASE' || row.type === 'BONUS' || row.type === 'ADMIN_CREDIT' || row.type === 'REFUNDED') {
        balance += row._sum.amount ?? 0;
      } else {
        balance -= row._sum.amount ?? 0;
      }
    }
    return Math.max(0, balance);
  }

  private async deductCredits(companyId: string, amount: number, rfqId: string) {
    const balance = await this.computeCreditBalance(companyId, this.prisma);
    if (balance < amount) {
      throw new ForbiddenException(`Insufficient RFQ credits. Need ${amount}, have ${balance}`);
    }

    await this.prisma.$transaction(async (tx) => {
      const current = await this.computeCreditBalance(companyId, tx);
      if (current < amount) {
        throw new ForbiddenException(`Insufficient RFQ credits. Need ${amount}, have ${current}`);
      }

      await tx.rfqCreditLedger.create({
        data: {
          companyId,
          type: 'USED',
          amount,
          balanceBefore: current,
          balanceAfter: current - amount,
          referenceId: rfqId,
          description: `RFQ posting: ${rfqId}`,
        },
      });
    });
  }
}
