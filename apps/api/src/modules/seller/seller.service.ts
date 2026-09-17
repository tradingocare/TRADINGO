import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSellerDocumentsDto } from './dto';

const SOCIAL_KEYS = [
  'instagramUrl', 'linkedinUrl', 'youtubeUrl', 'facebookUrl',
  'twitterUrl', 'whatsappUrl', 'indiamartUrl', 'tradeindiaUrl',
] as const;

const DOC_KEYS = [
  'gstCertUrl', 'panCardUrl', 'bankDocUrl', 'tradeLicenseUrl',
  'msmeUrl', 'incorporationUrl', 'iso9001Url', 'iso14001Url',
  'bisUrl', 'fssaiUrl', 'drugLicenseUrl', 'iecUrl',
] as const;

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

    if (dto.productImages !== undefined) {
      updateData.gallery = dto.productImages;
    }
    if (dto.catalogPdfUrl !== undefined) {
      updateData.videoIntroductionUrl = dto.catalogPdfUrl;
    }

    if (dto.categories) {
      await this.prisma.companyCategory.deleteMany({ where: { companyId: company.id } });
      for (const catId of dto.categories) {
        await this.prisma.companyCategory.create({
          data: { companyId: company.id, categoryId: catId },
        });
      }
    }

    const hasSocialUpdate = SOCIAL_KEYS.some(k => dto[k] !== undefined);
    if (hasSocialUpdate) {
      const existing: Record<string, string> = typeof company.socialLinks === 'object' && company.socialLinks !== null
        ? (company.socialLinks as Record<string, string>)
        : {};
      const merged = { ...existing };
      for (const k of SOCIAL_KEYS) {
        if (dto[k] !== undefined) merged[k] = dto[k];
      }
      updateData.socialLinks = merged;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedBy = userId;
      await this.prisma.company.update({
        where: { id: company.id },
        data: updateData,
      });
    }

    return this.getProfile(userId);
  }

  async updateDocuments(userId: string, docs: UpdateSellerDocumentsDto) {
    const company = await this.prisma.company.findFirst({
      where: { owners: { some: { userId } } },
    });
    if (!company) throw new NotFoundException('Company not found');

    const updateData: any = {
      ...(docs.aadhar !== undefined && { aadhar: docs.aadhar }),
      ...(docs.pan !== undefined && { pan: docs.pan }),
      ...(docs.gst !== undefined && { gst: docs.gst }),
      ...(docs.businessRegistration !== undefined && { businessRegistration: docs.businessRegistration }),
      ...(docs.addressProof !== undefined && { addressProof: docs.addressProof }),
      updatedBy: userId,
    };

    const hasDocUpdate = DOC_KEYS.some(k => docs[k] !== undefined);
    if (hasDocUpdate) {
      const existing: Record<string, string> =
        typeof company.registrationDocuments === 'object' && company.registrationDocuments !== null
          ? (company.registrationDocuments as Record<string, string>)
          : {};
      const merged = { ...existing };
      for (const k of DOC_KEYS) {
        if (docs[k] !== undefined) merged[k] = docs[k];
      }
      updateData.registrationDocuments = merged;
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: updateData,
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
    const socialLinks: Record<string, string> =
      typeof company.socialLinks === 'object' && company.socialLinks !== null
        ? (company.socialLinks as Record<string, string>)
        : {};
    const regDocs: Record<string, string> =
      typeof company.registrationDocuments === 'object' && company.registrationDocuments !== null
        ? (company.registrationDocuments as Record<string, string>)
        : {};
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
      productImages: Array.isArray(company.gallery) ? company.gallery : [],
      catalogPdfUrl: company.videoIntroductionUrl || null,
      ...socialLinks,
      ...regDocs,
    };
  }

  calculateScore(profile: any): number {
    let score = 0;
    const bi = [profile.name, profile.description, profile.sellerType].filter(Boolean).length;
    score += Math.min(bi * 3.3, 10);
    if ((profile.categories?.length ?? 0) > 0) score += 15;
    if (profile.logo) score += 5;
    if (profile.bannerUrl) score += 5;
    if (profile.gstNumber) score += 4;
    if (profile.panNumber) score += 4;
    if (profile.website) score += 2;
    const socialCount = [profile.instagramUrl, profile.linkedinUrl, profile.youtubeUrl, profile.facebookUrl, profile.twitterUrl].filter(Boolean).length;
    if (socialCount > 0) score += 3;
    score += Math.min((profile.productCount ?? 0) * 4, 20);
    if ((profile.productCount ?? 0) > 0) score += 5;
    const docCount = [profile.gstCertUrl, profile.panCardUrl, profile.bankDocUrl, profile.tradeLicenseUrl].filter(Boolean).length;
    score += Math.min(docCount * 3, 12);
    return Math.min(Math.round(score), 100);
  }
}
