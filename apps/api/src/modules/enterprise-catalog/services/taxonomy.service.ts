import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCatalogSynonymDto, UpdateCatalogSynonymDto, CreateIndustryCategoryMappingDto } from '../dto/taxonomy.dto';

@Injectable()
export class TaxonomyService {
  private readonly logger = new Logger(TaxonomyService.name);
  constructor(private readonly prisma: PrismaService) {}

  // Catalog Synonyms
  async createSynonym(dto: CreateCatalogSynonymDto) {
    const existing = await this.prisma.catalogSynonym.findUnique({ where: { term: dto.term } });
    if (existing) throw new ConflictException('Synonym term already exists');
    return this.prisma.catalogSynonym.create({ data: dto });
  }

  async findAllSynonyms(search?: string, locale?: string) {
    const where: any = {};
    if (search) where.term = { contains: search, mode: 'insensitive' };
    if (locale) where.locale = locale;
    return this.prisma.catalogSynonym.findMany({ where, orderBy: { term: 'asc' } });
  }

  async findSynonymById(id: string) {
    const syn = await this.prisma.catalogSynonym.findUnique({ where: { id } });
    if (!syn) throw new NotFoundException('Synonym not found');
    return syn;
  }

  async updateSynonym(id: string, dto: UpdateCatalogSynonymDto) {
    await this.findSynonymById(id);
    return this.prisma.catalogSynonym.update({ where: { id }, data: dto });
  }

  async removeSynonym(id: string) {
    await this.findSynonymById(id);
    return this.prisma.catalogSynonym.delete({ where: { id } });
  }

  // Industry-Category Mapping
  async createIndustryCategoryMapping(dto: CreateIndustryCategoryMappingDto) {
    const [industry, category] = await Promise.all([
      this.prisma.industry.findUnique({ where: { id: dto.industryId } }),
      this.prisma.category.findUnique({ where: { id: dto.categoryId } }),
    ]);
    if (!industry) throw new NotFoundException('Industry not found');
    if (!category) throw new NotFoundException('Category not found');
    const existing = await this.prisma.industryCategoryMapping.findUnique({ where: { industryId_categoryId: { industryId: dto.industryId, categoryId: dto.categoryId } } });
    if (existing) throw new ConflictException('Mapping already exists');
    return this.prisma.industryCategoryMapping.create({ data: dto, include: { industry: true, category: true } });
  }

  async findAllIndustryCategoryMappings(industryId?: string, categoryId?: string) {
    const where: any = {};
    if (industryId) where.industryId = industryId;
    if (categoryId) where.categoryId = categoryId;
    return this.prisma.industryCategoryMapping.findMany({ where, include: { industry: true, category: true }, orderBy: { createdAt: 'desc' } });
  }

  async removeIndustryCategoryMapping(id: string) {
    const mapping = await this.prisma.industryCategoryMapping.findUnique({ where: { id } });
    if (!mapping) throw new NotFoundException('Mapping not found');
    return this.prisma.industryCategoryMapping.delete({ where: { id } });
  }

  // Public catalog category authority (Phase 2-B — SEO foundation).
  // READ-ONLY single-record lookup by globally-unique slug. Returns ONLY
  // public-safe fields (no internal/audit data exists on this model beyond
  // what is selected here). Active-product counts use filtered relation
  // counts (ACTIVE + not-deleted + live company) in the SAME query — no
  // extra round-trips, no uncontrolled aggregation. Missing slug →
  // NotFoundException (callers render 404); inactive records are RETURNED
  // (callers apply NOINDEX) rather than hidden.
  async findCategoryBySlug(slug: string) {
    const clean = String(slug ?? '').trim();
    if (!clean) throw new NotFoundException('Catalog category not found');
    const liveProductWhere: any = {
      status: 'ACTIVE',
      deletedAt: null,
      company: { deletedAt: null, status: 'ACTIVE' },
    };
    const category = await this.prisma.catalogCategory.findUnique({
      where: { slug: clean },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        seoTitle: true,
        seoDescription: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
        subcategories: {
          select: {
            id: true,
            slug: true,
            name: true,
            seoTitle: true,
            seoDescription: true,
            items: {
              where: { isActive: true },
              select: { id: true, slug: true, name: true, type: true },
            },
            _count: { select: { products: { where: liveProductWhere } } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { products: { where: liveProductWhere } } },
      },
    });
    if (!category) throw new NotFoundException('Catalog category not found');
    // Flatten Prisma _count into a stable public contract. Zero code elsewhere
    // may depend on the raw _count shape.
    const { _count, subcategories, ...rest } = category;
    return {
      ...rest,
      activeProductCount: _count.products,
      subcategories: subcategories.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        seoTitle: s.seoTitle,
        seoDescription: s.seoDescription,
        activeProductCount: s._count.products,
        items: s.items,
      })),
    };
  }
}
