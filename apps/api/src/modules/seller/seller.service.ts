import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBuyers(userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { owners: { some: { userId } }, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const orders = await this.prisma.order.findMany({
      where: { sellerCompanyId: company.id },
      select: {
        buyerCompanyId: true,
        buyerCompany: { select: { id: true, name: true, slug: true, logo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seen = new Set<string>();
    const buyers = [];
    for (const o of orders) {
      if (!seen.has(o.buyerCompanyId) && o.buyerCompany) {
        seen.add(o.buyerCompanyId);
        buyers.push(o.buyerCompany);
      }
    }

    return { data: buyers, total: buyers.length };
  }

  async getProfile(userId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        owners: { some: { userId } },
        deletedAt: null,
      },
      include: {
        locations: { where: { deletedAt: null }, take: 1 },
        categories: { include: { category: true } },
        owners: { include: { user: { select: { name: true, email: true, mobile: true } } }, take: 1 },
        _count: { select: { products: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.mapCompanyProfile(company);
  }

  async updateProfile(userId: string, dto: any) {
    const company = await this.prisma.company.findFirst({
      where: { owners: { some: { userId } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.tagline !== undefined) updateData.tagline = dto.tagline;
    if (dto.businessType !== undefined) updateData.businessType = dto.businessType;
    if (dto.establishedYear !== undefined) updateData.establishedYear = dto.establishedYear;
    if (dto.employeeCount !== undefined) updateData.employeeCount = dto.employeeCount;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.logo !== undefined) updateData.logo = dto.logo;
    if (dto.banner !== undefined) updateData.banner = dto.banner;

    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { ...updateData, updatedBy: userId },
    });

    if (dto.categories) {
      await this.prisma.companyCategory.deleteMany({ where: { companyId: company.id } });
      for (const catId of dto.categories) {
        await this.prisma.companyCategory.create({
          data: { companyId: company.id, categoryId: catId },
        });
      }
    }

    return this.getProfile(userId);
  }

  async updateDocuments(userId: string, docs: Record<string, string>) {
    const company = await this.prisma.company.findFirst({
      where: { owners: { some: { userId } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    const updateData: any = {};
    for (const [key, url] of Object.entries(docs)) {
      updateData[key] = url;
    }
    await this.prisma.company.update({
      where: { id: company.id },
      data: { ...updateData, updatedBy: userId },
    });

    return { success: true };
  }

  async goLive(userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { owners: { some: { userId } } },
      include: { _count: { select: { products: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    const profile = await this.getProfile(userId);
    const score = this.calculateScore(profile);
    if (score < 70) throw new BadRequestException('Profile must be at least 70% complete to go live');

    await this.prisma.company.update({
      where: { id: company.id },
      data: { status: 'ACTIVE' as any, updatedBy: userId },
    });

    return { success: true, message: 'Your store is now live!' };
  }

  private mapCompanyProfile(company: any) {
    const loc = company.locations?.[0] || {};
    const owner = company.owners?.[0]?.user || {};
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      tagline: company.tagline,
      logo: company.logo,
      banner: company.banner,
      bannerUrl: company.banner,
      businessType: company.businessType,
      sellerType: company.businessType,
      gstNumber: company.gstNumber || null,
      panNumber: company.panNumber || null,
      email: company.email || owner.email || null,
      mobile: company.mobile || owner.mobile || null,
      ownerName: owner.name || null,
      city: loc.city || '',
      state: loc.state || '',
      addressLine1: loc.addressLine1 || '',
      pincode: loc.pincode || '',
      website: company.website,
      establishedYear: company.establishedYear,
      employeeCount: company.employeeCount,
      trustScore: company.trustScore,
      categories: (company.categories || []).map((cc: any) => cc.category?.slug || cc.categoryId),
      productCount: company._count?.products || 0,
      createdAt: company.createdAt,
    };
  }

  calculateScore(profile: any): number {
    let score = 0;
    const bi = [profile.name, profile.description, profile.sellerType].filter(Boolean).length;
    score += Math.min(bi * 3.3, 10);
    if ((profile.categories?.length ?? 0) > 0) score += 15;
    if (profile.logo) score += 5;
    if (profile.bannerUrl) score += 5;
    score += Math.min((profile.productCount ?? 0) * 4, 20);
    return Math.min(Math.round(score), 100);
  }
}
