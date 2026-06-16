import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma, ImportJobType, ImportJobStatus, ImportRowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${uuid().slice(0, 8)}`;
}

function generateUniqueSlug(name: string): string {
  return `${slugify(name)}-${uuid().slice(0, 6)}`;
}

function generateKeywords(text: string): string[] {
  return text.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
}

function computeChecksum(data: unknown): string {
  const json = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

@Injectable()
export class CatalogImportService {
  private readonly logger = new Logger(CatalogImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async startImport(type: ImportJobType, data: any[]) {
    if (!data || data.length === 0) {
      throw new ConflictException('No data provided for import');
    }

    const job = await this.prisma.importJob.create({
      data: {
        type,
        status: 'RUNNING',
        totalRows: data.length,
        startedAt: new Date(),
      },
    });

    let imported = 0;
    let duplicate = 0;
    let error = 0;
    let skipped = 0;
    const rows: Prisma.ImportJobRowCreateManyInput[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;
      const checksum = computeChecksum(row);
      const baseEntry: Prisma.ImportJobRowCreateManyInput = {
        importJobId: job.id,
        rowNumber,
        status: 'PENDING',
        rawData: row,
        errors: [],
        warnings: [],
        checksum,
      };

      try {
        const duplicateCheck = await this.prisma.importJobRow.findFirst({
          where: { importJobId: job.id, checksum, status: 'DUPLICATE' },
          select: { id: true },
        });

        if (duplicateCheck) {
          duplicate++;
          rows.push({ ...baseEntry, status: 'DUPLICATE' as ImportRowStatus, duplicateOf: duplicateCheck.id });
          continue;
        }

        const valid = this.validateRow(type, row);
        if (!valid.valid) {
          skipped++;
          rows.push({ ...baseEntry, status: 'INVALID' as ImportRowStatus, errors: valid.errors });
          continue;
        }

        let entityId: string | null = null;

        switch (type) {
          case 'CATEGORY': {
            const slug = slugify(row.name || '');
            const slugUnique = `${slug}-${uuid().slice(0, 6)}`;
            const created = await this.prisma.category.upsert({
              where: { slug: slugUnique },
              update: {
                name: row.name,
                description: row.description || null,
                icon: row.icon || null,
                sortOrder: row.sortOrder || 0,
                seoTitle: row.seoTitle || `${row.name} - TRADINGO B2B`,
                seoDescription: row.seoDescription || null,
                isActive: row.isActive !== false,
              },
              create: {
                name: row.name,
                slug: slugUnique,
                description: row.description || null,
                icon: row.icon || null,
                sortOrder: row.sortOrder || 0,
                seoTitle: row.seoTitle || `${row.name} - TRADINGO B2B`,
                seoDescription: row.seoDescription || null,
                isActive: row.isActive !== false,
              },
            });
            entityId = created.id;
            break;
          }

          case 'SUBCATEGORY': {
            const parent = await this.prisma.category.findUnique({
              where: { slug: row.parentSlug || '' },
              select: { id: true },
            });
            if (!parent) {
              skipped++;
              rows.push({ ...baseEntry, status: 'INVALID' as ImportRowStatus, errors: [`Parent category "${row.parentSlug}" not found`] });
              continue;
            }
            const slug = slugify(row.name || '');
            const slugUnique = `${slug}-${uuid().slice(0, 6)}`;
            const created = await this.prisma.category.upsert({
              where: { slug: slugUnique },
              update: {
                name: row.name,
                parentId: parent.id,
                sortOrder: row.sortOrder || 0,
                seoTitle: row.seoTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
              create: {
                name: row.name,
                slug: slugUnique,
                parentId: parent.id,
                sortOrder: row.sortOrder || 0,
                seoTitle: row.seoTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
            });
            entityId = created.id;
            break;
          }

          case 'PRODUCT_MASTER': {
            const slug = generateUniqueSlug(row.name || '');
            const keywords = generateKeywords(row.name || '');
            const created = await this.prisma.productMaster.upsert({
              where: { slug },
              update: {
                name: row.name,
                categoryId: row.categoryId || null,
                subcategoryId: row.subcategoryId || null,
                shortDescription: row.shortDescription || null,
                unit: row.unit || null,
                moq: row.moq || null,
                priceRangeMin: row.priceRangeMin || null,
                priceRangeMax: row.priceRangeMax || null,
                hsCode: row.hsCode || null,
                searchKeywords: row.searchKeywords || keywords,
                synonyms: row.synonyms || keywords,
                tags: row.tags || keywords,
                metaTitle: row.metaTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
              create: {
                name: row.name,
                slug,
                categoryId: row.categoryId || null,
                subcategoryId: row.subcategoryId || null,
                shortDescription: row.shortDescription || null,
                unit: row.unit || null,
                moq: row.moq || null,
                priceRangeMin: row.priceRangeMin || null,
                priceRangeMax: row.priceRangeMax || null,
                hsCode: row.hsCode || null,
                searchKeywords: row.searchKeywords || keywords,
                synonyms: row.synonyms || keywords,
                tags: row.tags || keywords,
                metaTitle: row.metaTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
            });
            entityId = created.id;
            break;
          }

          case 'SERVICE_MASTER': {
            const slug = generateUniqueSlug(row.name || '');
            const keywords = generateKeywords(row.name || '');
            const created = await this.prisma.serviceMaster.upsert({
              where: { slug },
              update: {
                name: row.name,
                categoryId: row.categoryId || null,
                subcategoryId: row.subcategoryId || null,
                unit: row.unit || null,
                priceRangeMin: row.priceRangeMin || null,
                priceRangeMax: row.priceRangeMax || null,
                searchKeywords: row.searchKeywords || keywords,
                synonyms: row.synonyms || keywords,
                tags: row.tags || keywords,
                metaTitle: row.metaTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
              create: {
                name: row.name,
                slug,
                categoryId: row.categoryId || null,
                subcategoryId: row.subcategoryId || null,
                unit: row.unit || null,
                priceRangeMin: row.priceRangeMin || null,
                priceRangeMax: row.priceRangeMax || null,
                searchKeywords: row.searchKeywords || keywords,
                synonyms: row.synonyms || keywords,
                tags: row.tags || keywords,
                metaTitle: row.metaTitle || `${row.name} - TRADINGO`,
                isActive: row.isActive !== false,
              },
            });
            entityId = created.id;
            break;
          }
        }

        imported++;
        rows.push({
          ...baseEntry,
          status: 'IMPORTED' as ImportRowStatus,
          entityType: type,
          entityId,
        });
      } catch (err) {
        error++;
        rows.push({
          ...baseEntry,
          status: 'ERROR' as ImportRowStatus,
          errors: [err instanceof Error ? err.message : String(err)],
        });
      }
    }

    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await this.prisma.importJobRow.createMany({ data: rows.slice(i, i + BATCH_SIZE) });
    }

    const finalStatus: ImportJobStatus = error > 0
      ? (imported > 0 ? 'PARTIAL' : 'FAILED')
      : 'COMPLETED';

    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        importedRows: imported,
        duplicateRows: duplicate,
        skippedRows: skipped,
        errorRows: error,
        completedAt: new Date(),
        summary: { total: data.length, imported, duplicate, skipped, error },
      },
    });

    this.logger.log(`Import job ${job.id} completed: ${finalStatus} (${imported} imported, ${duplicate} duplicate, ${skipped} skipped, ${error} error)`);

    return this.getJob(job.id);
  }

  async retryImport(jobId: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        rows: {
          where: { status: { in: ['ERROR', 'INVALID', 'SKIPPED'] } },
          select: { id: true, rawData: true, rowNumber: true },
        },
      },
    });

    if (!job) throw new NotFoundException('Import job not found');
    if (job.status !== 'FAILED' && job.status !== 'PARTIAL') {
      throw new ConflictException(`Cannot retry job in status "${job.status}". Only FAILED or PARTIAL jobs can be retried.`);
    }

    const failedRows = job.rows;
    if (failedRows.length === 0) {
      throw new ConflictException('No failed rows to retry');
    }

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    const rawDataArray = failedRows
      .filter((r) => r.rawData && typeof r.rawData === 'object')
      .map((r) => r.rawData as Record<string, unknown>);

    const result = await this.startImport(job.type, rawDataArray as any[]);

    return result;
  }

  async rollbackImport(jobId: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'IMPORTED' }, select: { entityType: true, entityId: true } } },
    });
    if (!job) throw new NotFoundException('Import job not found');

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'ROLLING_BACK' },
    });

    let rolledBack = 0;
    for (const row of job.rows) {
      if (!row.entityId) continue;
      try {
        switch (row.entityType) {
          case 'CATEGORY':
          case 'SUBCATEGORY':
            await this.prisma.category.delete({ where: { id: row.entityId } });
            break;
          case 'PRODUCT_MASTER':
            await this.prisma.productMaster.delete({ where: { id: row.entityId } });
            break;
          case 'SERVICE_MASTER':
            await this.prisma.serviceMaster.delete({ where: { id: row.entityId } });
            break;
        }
        await this.prisma.importJobRow.updateMany({
          where: { importJobId: jobId, entityId: row.entityId },
          data: { status: 'ROLLED_BACK' },
        });
        rolledBack++;
      } catch (err) {
        this.logger.warn(`Failed to rollback entity ${row.entityId} (${row.entityType}): ${err}`);
      }
    }

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'ROLLED_BACK',
        rolledBackAt: new Date(),
        summary: { rolledBack, total: job.rows.length },
      },
    });

    this.logger.log(`Import job ${jobId} rolled back: ${rolledBack} entities removed`);
    return this.getJob(jobId);
  }

  async getJob(jobId: string) {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        _count: { select: { rows: true } },
      },
    });
    if (!job) throw new NotFoundException('Import job not found');

    const statusCounts = await this.prisma.importJobRow.groupBy({
      by: ['status'],
      where: { importJobId: jobId },
      _count: true,
    });

    return {
      ...job,
      rowStats: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    };
  }

  async getJobs(filters: {
    type?: ImportJobType;
    status?: ImportJobStatus;
    cursor?: string;
    limit?: number;
    page?: number;
  }) {
    const { type, status, cursor, limit = 20, page } = filters;
    const where: Prisma.ImportJobWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const findArgs: Prisma.ImportJobFindManyArgs = {
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rows: true } },
      },
    };

    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1;
    }

    if (page && !cursor) {
      findArgs.skip = (page - 1) * limit;
    }

    const [data, total] = await Promise.all([
      this.prisma.importJob.findMany(findArgs),
      this.prisma.importJob.count({ where }),
    ]);

    return {
      jobs: data,
      total,
      page: page || 1,
      limit,
    };
  }

  async getJobStats() {
    const [byType, byStatus, totalJobs, totalRows] = await Promise.all([
      this.prisma.importJob.groupBy({
        by: ['type'],
        _count: true,
        _sum: { importedRows: true, duplicateRows: true, errorRows: true },
      }),
      this.prisma.importJob.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.importJob.count(),
      this.prisma.importJobRow.count(),
    ]);

    const totalImported = byType.reduce((acc, t) => acc + (t._sum.importedRows || 0), 0);
    const totalErrors = byType.reduce((acc, t) => acc + (t._sum.errorRows || 0), 0);
    const totalDuplicates = byType.reduce((acc, t) => acc + (t._sum.duplicateRows || 0), 0);

    return {
      totalJobs,
      totalRows,
      totalImported,
      totalErrors,
      totalDuplicates,
      byType,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    };
  }

  async searchCatalog(query: string, filters: {
    type?: 'PRODUCT' | 'SERVICE';
    categoryId?: string;
    subcategoryId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const { type, categoryId, subcategoryId, limit = 20, cursor } = filters;

    const baseWhere = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { searchKeywords: { has: query.toLowerCase() } },
            { synonyms: { has: query.toLowerCase() } },
          ],
        }
      : {};

    const results: { products: any[]; services: any[] } = { products: [], services: [] };

    if (!type || type === 'PRODUCT') {
      const where: Prisma.ProductMasterWhereInput = { ...baseWhere, isActive: true };
      if (categoryId) where.categoryId = categoryId;
      if (subcategoryId) where.subcategoryId = subcategoryId;

      const findArgs: Prisma.ProductMasterFindManyArgs = {
        where,
        take: limit,
        orderBy: { name: 'asc' },
      };
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      results.products = await this.prisma.productMaster.findMany(findArgs);
    }

    if (!type || type === 'SERVICE') {
      const where: Prisma.ServiceMasterWhereInput = { ...baseWhere, isActive: true };
      if (categoryId) where.categoryId = categoryId;
      if (subcategoryId) where.subcategoryId = subcategoryId;

      const findArgs: Prisma.ServiceMasterFindManyArgs = {
        where,
        take: limit,
        orderBy: { name: 'asc' },
      };
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }

      results.services = await this.prisma.serviceMaster.findMany(findArgs);
    }

    return results;
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    return {
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      message: 'File uploaded successfully. Preview or start import to process.',
    };
  }

  async previewImport(type: ImportJobType, data: any[]) {
    if (!data || data.length === 0) {
      throw new BadRequestException('No data provided for preview');
    }

    const validated = data.map((row, index) => {
      const result = this.validateRow(type, row);
      return {
        rowNumber: index + 1,
        valid: result.valid,
        errors: result.errors,
        data: row,
      };
    });

    return {
      type,
      totalRows: data.length,
      validRows: validated.filter((r) => r.valid).length,
      invalidRows: validated.filter((r) => !r.valid).length,
      rows: validated.slice(0, 20),
      message: 'Preview generated. Review and start import to proceed.',
    };
  }

  async validateImport(type: ImportJobType, data: any[]) {
    if (!data || data.length === 0) {
      throw new BadRequestException('No data provided for validation');
    }

    const validated = data.map((row, index) => {
      const result = this.validateRow(type, row);
      return {
        rowNumber: index + 1,
        valid: result.valid,
        errors: result.errors,
        warnings: [],
        data: row,
      };
    });

    const validCount = validated.filter((r) => r.valid).length;

    return {
      type,
      totalRows: data.length,
      validRows: validCount,
      invalidRows: data.length - validCount,
      isValid: validCount === data.length,
      rows: validated,
    };
  }

  private validateRow(type: ImportJobType, row: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!row || typeof row !== 'object') {
      errors.push('Row data must be a non-null object');
      return { valid: false, errors };
    }
    if (!row.name || typeof row.name !== 'string') {
      errors.push('Field "name" is required and must be a string');
    }
    return { valid: errors.length === 0, errors };
  }
}
