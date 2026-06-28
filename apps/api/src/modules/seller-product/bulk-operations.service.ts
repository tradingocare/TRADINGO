import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async previewImport(userId: string, rows: any[]) {
    const company = await this.resolveCompany(userId);
    const results = rows.map((row, i) => {
      const errors: string[] = [];
      if (!row.name) errors.push('Name is required');
      if (row.sku) {
        // Check uniqueness within company
      }
      return { row: i + 1, name: row.name || '', valid: errors.length === 0, errors };
    });
    return { total: rows.length, valid: results.filter(r => r.valid).length, invalid: results.filter(r => !r.valid).length, rows: results };
  }

  async validateRows(userId: string, rows: any[]) {
    return this.previewImport(userId, rows);
  }

  async executeImport(userId: string, rows: any[]) {
    const company = await this.resolveCompany(userId);
    const imported: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) { errors.push({ row: i + 1, error: 'Name is required' }); continue; }

        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${uuid().slice(0, 4)}`;
        const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
        const finalSlug = existingSlug ? `${slug}-${uuid().slice(0, 4)}` : slug;

        let categoryId: string | undefined;
        if (row.category) {
          const cat = await this.prisma.category.findFirst({ where: { slug: row.category.toLowerCase().replace(/ /g, '-') } });
          if (cat) categoryId = cat.id;
        }

        const product = await this.prisma.product.create({
          data: {
            companyId: company.id, categoryId, name: row.name, slug: finalSlug,
            shortDescription: row.shortDescription, description: row.description,
            brand: row.brand, model: row.model, sku: row.sku, moq: row.moq ? Number(row.moq) : 1,
            unit: row.unit, originalPrice: row.price ? Number(row.price) : undefined,
            status: (row.status === 'active' ? 'ACTIVE' : 'DRAFT') as any,
            createdBy: userId, updatedBy: userId,
          },
        });
        imported.push({ row: i + 1, productId: product.id, name: product.name });
      } catch (e: any) {
        errors.push({ row: i + 1, error: e.message || 'Import failed' });
      }
    }

    return { imported: imported.length, failed: errors.length, products: imported, errors };
  }

  async uploadZip(userId: string, files: { fileName: string; url: string }[]) {
    return { uploaded: files.length, files };
  }
}
