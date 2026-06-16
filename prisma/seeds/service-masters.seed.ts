import { PrismaClient } from '@prisma/client';
import { SeedResult, slugify, generateUniqueSlug, generateKeywords, BATCH_SIZE, logProgress, createJobRow, CsvRow, ImportJobRowInsert } from './seed.utils.ts';

export class ServiceMastersSeeder {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async run(serviceRows: CsvRow[]): Promise<SeedResult> {
    const existingSlugs = new Set(
      (await this.prisma.serviceMaster.findMany({ select: { slug: true } })).map((s) => s.slug),
    );

    const job = await this.prisma.importJob.create({
      data: {
        type: 'SERVICE_MASTER',
        status: 'RUNNING',
        totalRows: serviceRows.length,
        startedAt: new Date(),
      },
    });

    const rows: ImportJobRowInsert[] = [];
    let imported = 0;
    let duplicate = 0;
    let error = 0;
    const errors: string[] = [];

    for (let i = 0; i < serviceRows.length; i++) {
      const row = serviceRows[i];
      const rowNumber = i + 1;
      const baseSlug = slugify(row.name);

      try {
        const existing = await this.prisma.serviceMaster.findFirst({
          where: { OR: [{ slug: baseSlug }, { name: { equals: row.name, mode: 'insensitive' } }] },
          select: { id: true, slug: true },
        });
        if (existing) {
          duplicate++;
          existingSlugs.add(existing.slug);
          rows.push(createJobRow(job.id, rowNumber, 'DUPLICATE', 'SERVICE_MASTER', existing.id, row as any));
          continue;
        }

        const slug = generateUniqueSlug(row.name, existingSlugs);

        const category = await this.prisma.category.findFirst({
          where: { name: { equals: row.category, mode: 'insensitive' }, parentId: null },
          select: { id: true },
        });

        const subcategory = row.subCategory
          ? await this.prisma.category.findFirst({
              where: { name: { equals: row.subCategory, mode: 'insensitive' }, parentId: { not: null } },
              select: { id: true },
            })
          : null;

        const keywords = generateKeywords(row.name);

        await this.prisma.serviceMaster.upsert({
          where: { slug },
          update: {
            name: row.name,
            categoryId: category?.id || null,
            subcategoryId: subcategory?.id || null,
            unit: row.unit || null,
            searchKeywords: keywords,
            synonyms: keywords,
            tags: keywords,
            metaTitle: `${row.name} - TRADINGO B2B`,
            sourceData: row as any,
            isActive: true,
          },
          create: {
            name: row.name,
            slug,
            categoryId: category?.id || null,
            subcategoryId: subcategory?.id || null,
            unit: row.unit || null,
            searchKeywords: keywords,
            synonyms: keywords,
            tags: keywords,
            metaTitle: `${row.name} - TRADINGO B2B`,
            sourceData: row as any,
            isActive: true,
          },
        });

        imported++;
        existingSlugs.add(slug);
        rows.push(createJobRow(job.id, rowNumber, 'IMPORTED', 'SERVICE_MASTER', slug, row as any));

        if (imported % BATCH_SIZE === 0) logProgress('ServiceMasters', i + 1, serviceRows.length, imported, duplicate, error);
      } catch (err) {
        error++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`ServiceMaster "${row.name}": ${msg}`);
        rows.push(createJobRow(job.id, rowNumber, 'ERROR', 'SERVICE_MASTER', undefined, row as any, [msg]));
      }
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await this.prisma.importJobRow.createMany({ data: rows.slice(i, i + BATCH_SIZE) as any });
    }

    const finalStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        importedRows: imported,
        duplicateRows: duplicate,
        errorRows: error,
        completedAt: new Date(),
        summary: { total: serviceRows.length, imported, duplicate, error },
      },
    });

    logProgress('ServiceMasters', serviceRows.length, serviceRows.length, imported, duplicate, error);
    return { jobId: job.id, status: finalStatus, imported, duplicate, skipped: 0, error, errors, summary: { total: serviceRows.length } };
  }

  async resume(jobId: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'ERROR' }, select: { rawData: true } } },
    });
    if (!job) return { jobId, status: 'FAILED', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} not found`], summary: {} };
    if (job.status !== 'FAILED' && job.status !== 'PARTIAL') {
      return { jobId, status: job.status as any, imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} is ${job.status}, cannot resume`], summary: {} };
    }

    const failedRows: CsvRow[] = [];
    for (const r of job.rows) {
      if (r.rawData && typeof r.rawData === 'object') {
        const d = r.rawData as any;
        if (d.name) failedRows.push(d as CsvRow);
      }
    }
    return this.run(failedRows);
  }

  async rollback(jobId: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'IMPORTED', entityType: 'SERVICE_MASTER' }, select: { entityId: true } } },
    });
    if (!job) return { jobId, status: 'FAILED', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} not found`], summary: {} };

    await this.prisma.importJob.update({ where: { id: jobId }, data: { status: 'ROLLING_BACK' } });

    let rolledBack = 0;
    const errors: string[] = [];
    for (const row of job.rows) {
      if (!row.entityId) continue;
      try {
        const sm = await this.prisma.serviceMaster.findUnique({ where: { slug: row.entityId }, select: { id: true } });
        if (sm) {
          await this.prisma.serviceMaster.delete({ where: { id: sm.id } });
          rolledBack++;
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    await this.prisma.importJobRow.updateMany({
      where: { importJobId: jobId, status: 'IMPORTED', entityType: 'SERVICE_MASTER' },
      data: { status: 'ROLLED_BACK' },
    });

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'ROLLED_BACK', rolledBackAt: new Date(), summary: { rolledBack, total: job.rows.length } },
    });

    return { jobId, status: 'ROLLED_BACK', imported: rolledBack, duplicate: 0, skipped: 0, error: errors.length, errors, summary: { rolledBack, total: job.rows.length } };
  }
}
