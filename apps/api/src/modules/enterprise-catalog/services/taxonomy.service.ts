import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCatalogSynonymDto, UpdateCatalogSynonymDto, CreateIndustryCategoryMappingDto, UpdateIndustryCategoryMappingDto } from '../dto/taxonomy.dto';

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
}
