import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
}
