import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma, ClaimStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductClaimDto } from './dto/create-product-claim.dto';
import { UpdateProductClaimDto } from './dto/update-product-claim.dto';
import { Role } from '../../common/enums/role.enum';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `prod-${uuid().slice(0, 8)}`;
}

@Injectable()
export class ProductClaimsService {
  private readonly logger = new Logger(ProductClaimsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async requireCompanyOwner(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN) return;

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenException('You are not an owner of this company');
  }

  private async generateUniqueSlug(name: string, companySlug: string): Promise<string> {
    const base = slugify(name);
    let slug = `${companySlug}-${base}`;
    let attempt = 0;
    while (await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${companySlug}-${base}-${attempt}`;
    }
    return slug;
  }

  async searchProductMasters(query: string, filters: { categoryId?: string; subcategoryId?: string; page?: number; limit?: number }) {
    const { categoryId, subcategoryId, page = 1, limit = 20 } = filters;
    const where: Prisma.ProductMasterWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { searchKeywords: { has: query } },
      ],
    };
    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;

    const [data, total] = await Promise.all([
      this.prisma.productMaster.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.productMaster.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(companyId: string, dto: CreateProductClaimDto, userId: string) {
    await this.requireCompanyOwner(companyId, userId);

    if (dto.productMasterId) {
      const master = await this.prisma.productMaster.findUnique({ where: { id: dto.productMasterId }, select: { id: true } });
      if (!master) throw new NotFoundException('ProductMaster not found');
    }

    const claim = await this.prisma.productClaim.create({
      data: {
        productMasterId: dto.productMasterId,
        companyId,
        status: 'DRAFT',
        name: dto.name,
        shortDescription: dto.shortDescription,
        description: dto.description,
        unit: dto.unit,
        price: dto.price,
        currency: 'INR',
        moq: dto.moq,
        notes: dto.notes,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        productMaster: { select: { id: true, name: true } },
      },
    });

    return claim;
  }

  async findAll(companyId: string, status?: string) {
    const where: Prisma.ProductClaimWhereInput = { companyId, deletedAt: null };
    if (status) where.status = status as ClaimStatus;

    const [data, total] = await Promise.all([
      this.prisma.productClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          productMaster: { select: { id: true, name: true, slug: true } },
          attachments: { select: { id: true, fileName: true, fileUrl: true, type: true } },
        },
      }),
      this.prisma.productClaim.count({ where }),
    ]);

    return { data, meta: { total } };
  }

  async findById(id: string) {
    const claim = await this.prisma.productClaim.findFirst({
      where: { id, deletedAt: null },
      include: {
        productMaster: { select: { id: true, name: true, slug: true, category: { select: { id: true, name: true } } } },
        company: { select: { id: true, name: true, slug: true } },
        attachments: true,
        product: { select: { id: true, name: true, slug: true, status: true } },
      },
    });
    if (!claim) throw new NotFoundException('Product claim not found');
    return claim;
  }

  async update(id: string, dto: UpdateProductClaimDto, userId: string) {
    const claim = await this.prisma.productClaim.findFirst({ where: { id, deletedAt: null } });
    if (!claim) throw new NotFoundException('Product claim not found');
    if (claim.status !== 'DRAFT') throw new BadRequestException('Only draft claims can be updated');
    await this.requireCompanyOwner(claim.companyId, userId);

    const updated = await this.prisma.productClaim.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.moq !== undefined && { moq: dto.moq }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy: userId,
      },
      include: { attachments: true, productMaster: { select: { id: true, name: true } } },
    });

    return updated;
  }

  async submit(id: string, userId: string) {
    const claim = await this.prisma.productClaim.findFirst({ where: { id, deletedAt: null } });
    if (!claim) throw new NotFoundException('Product claim not found');
    if (claim.status !== 'DRAFT') throw new BadRequestException('Only draft claims can be submitted');
    await this.requireCompanyOwner(claim.companyId, userId);

    const updated = await this.prisma.productClaim.update({
      where: { id },
      data: { status: 'PENDING', updatedBy: userId },
    });

    return updated;
  }

  async approve(id: string, userId: string) {
    const claim = await this.prisma.productClaim.findFirst({
      where: { id, deletedAt: null },
      include: { productMaster: { select: { id: true, categoryId: true } } },
    });
    if (!claim) throw new NotFoundException('Product claim not found');
    if (claim.status !== 'PENDING') throw new BadRequestException('Only pending claims can be approved');

    const company = await this.prisma.company.findUnique({
      where: { id: claim.companyId },
      select: { slug: true, trustScore: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const slug = await this.generateUniqueSlug(claim.name, company.slug);

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          companyId: claim.companyId,
          categoryId: claim.productMaster?.categoryId,
          productMasterId: claim.productMasterId,
          name: claim.name,
          slug,
          shortDescription: claim.shortDescription,
          description: claim.description,
          unit: claim.unit,
          moq: claim.moq ?? 1,
          status: 'ACTIVE',
          trustScoreSnapshot: company.trustScore,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const updated = await tx.productClaim.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          productId: product.id,
          reviewedBy: userId,
          reviewedAt: new Date(),
          updatedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PRODUCT_CLAIM_APPROVED',
          resource: `product-claim:${id}`,
          metadata: { productId: product.id, productName: claim.name, companyId: claim.companyId },
        },
      });

      return { product, claim: updated };
    });

    this.logger.log(`Product claim ${id} approved. Product ${result.product.id} created.`);
    return result;
  }

  async reject(id: string, reason: string, userId: string) {
    const claim = await this.prisma.productClaim.findFirst({ where: { id, deletedAt: null } });
    if (!claim) throw new NotFoundException('Product claim not found');
    if (claim.status !== 'PENDING') throw new BadRequestException('Only pending claims can be rejected');

    const updated = await this.prisma.productClaim.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedBy: userId,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const claim = await this.prisma.productClaim.findFirst({ where: { id, deletedAt: null } });
    if (!claim) throw new NotFoundException('Product claim not found');
    if (claim.status !== 'DRAFT') throw new BadRequestException('Only draft claims can be deleted');
    await this.requireCompanyOwner(claim.companyId, userId);

    await this.prisma.productClaim.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
