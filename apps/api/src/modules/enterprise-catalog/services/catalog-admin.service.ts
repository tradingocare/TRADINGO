import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CatalogAdminService {
  private readonly logger = new Logger(CatalogAdminService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [totalCategories, activeCategories, totalBrands, verifiedBrands, totalAttributes, totalSynonyms, totalMappings, qualityStats] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.globalBrand.count(),
      this.prisma.globalBrand.count({ where: { verificationStatus: 'VERIFIED' as any } }),
      this.prisma.globalAttribute.count(),
      this.prisma.catalogSynonym.count(),
      this.prisma.industryCategoryMapping.count(),
      this.prisma.catalogQualityScore.aggregate({ _avg: { total: true }, _count: true }),
    ]);

    const [pendingApprovals, missingImages, missingSeo, totalProducts, importJobs] = await Promise.all([
      this.prisma.product.count({ where: { status: 'PENDING_APPROVAL' as any, deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, media: { none: {} } } }),
      this.prisma.product.count({ where: { deletedAt: null, OR: [{ metaTitle: null }, { metaDescription: null }] } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.importJob.count(),
    ]);

    return {
      categories: { total: totalCategories, active: activeCategories },
      brands: { total: totalBrands, verified: verifiedBrands },
      attributes: { total: totalAttributes },
      synonyms: { total: totalSynonyms },
      industryMappings: { total: totalMappings },
      products: { total: totalProducts, pendingApprovals, missingImages, missingSeo },
      quality: { avgScore: Math.round(qualityStats._avg.total || 0), scoredProducts: qualityStats._count },
      imports: { totalJobs: importJobs },
    };
  }

  async getTaxonomyTree() {
    const [categories, industries, mappings, brands, attributes] = await Promise.all([
      this.prisma.category.findMany({ where: { isActive: true }, include: { children: { where: { isActive: true } }, industryMappings: { include: { industry: true } } }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.industry.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.industryCategoryMapping.findMany({ include: { industry: true, category: true } }),
      this.prisma.globalBrand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.globalAttribute.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    return { categories, industries, mappings, brands, attributes };
  }
}
