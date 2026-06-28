import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ProductExportService {
  private readonly logger = new Logger(ProductExportService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async startExport(userId: string, type: 'EXCEL' | 'CSV') {
    const company = await this.resolveCompany(userId);
    const products = await this.prisma.product.findMany({
      where: { companyId: company.id, deletedAt: null },
      include: { media: { where: { isPrimary: true }, take: 1 }, inventory: true, category: { select: { name: true } } },
    });

    const formatProduct = (p: any) => ({
      name: p.name, slug: p.slug, category: p.category?.name || '', brand: p.brand || '', model: p.model || '',
      sku: p.sku || '', price: p.originalPrice || 0, moq: p.moq, unit: p.unit || '',
      stock: p.inventory?.availableQuantity || 0, status: p.status, views: p.viewCount,
      image: p.media[0]?.url || '', createdAt: p.createdAt,
    });

    let csv = '';
    const headers = Object.keys(formatProduct(products[0] || {})).join(',');
    csv += headers + '\n';
    for (const p of products) {
      csv += Object.values(formatProduct(p)).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
    }

    const job = await this.prisma.productExportJob.create({
      data: { companyId: company.id, type, status: 'COMPLETED', fileUrl: `data:text/csv;base64,${Buffer.from(csv).toString('base64')}` },
    });

    return { jobId: job.id, status: 'COMPLETED', rowCount: products.length };
  }

  async listJobs(userId: string) {
    const company = await this.resolveCompany(userId);
    return this.prisma.productExportJob.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async downloadJob(userId: string, jobId: string) {
    const company = await this.resolveCompany(userId);
    const job = await this.prisma.productExportJob.findFirst({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Export job not found');
    return { fileUrl: job.fileUrl, type: job.type };
  }
}
