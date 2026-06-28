import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async listBrands(userId: string) {
    const company = await this.resolveCompany(userId);
    return this.prisma.productBrand.findMany({
      where: { companyId: company.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createBrand(userId: string, dto: { name: string; logo?: string; description?: string }) {
    const company = await this.resolveCompany(userId);
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `brand-${uuid().slice(0, 6)}`;
    const brand = await this.prisma.productBrand.create({
      data: { companyId: company.id, name: dto.name, slug, logo: dto.logo, description: dto.description },
    });
    return brand;
  }

  async updateBrand(userId: string, brandId: string, dto: { name?: string; logo?: string; description?: string; status?: string }) {
    const company = await this.resolveCompany(userId);
    const brand = await this.prisma.productBrand.findFirst({ where: { id: brandId, companyId: company.id } });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.prisma.productBrand.update({ where: { id: brandId }, data: dto as any });
  }

  async deleteBrand(userId: string, brandId: string) {
    const company = await this.resolveCompany(userId);
    const brand = await this.prisma.productBrand.findFirst({ where: { id: brandId, companyId: company.id } });
    if (!brand) throw new NotFoundException('Brand not found');
    await this.prisma.productBrand.delete({ where: { id: brandId } });
    return { success: true };
  }
}
