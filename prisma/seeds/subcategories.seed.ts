import { PrismaClient } from '@prisma/client';
import { SeedResult, slugify, generateUniqueSlug, BATCH_SIZE, logProgress, createJobRow, ImportJobRowInsert } from './seed.utils.ts';

export class SubcategoriesSeeder {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async run(subcategoryEntries: { category: string; subCategory: string }[]): Promise<SeedResult> {
    const existingSlugs = new Set(
      (await this.prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug),
    );

    const job = await this.prisma.importJob.create({
      data: {
        type: 'SUBCATEGORY',
        status: 'RUNNING',
        totalRows: subcategoryEntries.length,
        startedAt: new Date(),
      },
    });

    const rows: ImportJobRowInsert[] = [];
    let imported = 0;
    let duplicate = 0;
    let error = 0;
    const errors: string[] = [];

    for (let i = 0; i < subcategoryEntries.length; i++) {
      const { category, subCategory } = subcategoryEntries[i];
      const rowNumber = i + 1;
      const baseSlug = slugify(subCategory);

      try {
        const parent = await this.prisma.category.findFirst({
          where: { name: { equals: category, mode: 'insensitive' }, parentId: null },
          select: { id: true },
        });
        if (!parent) {
          error++;
          const msg = `Parent category "${category}" not found`;
          errors.push(msg);
          rows.push(createJobRow(job.id, rowNumber, 'ERROR', 'SUBCATEGORY', undefined, { category, subCategory }, [msg]));
          continue;
        }

        const existing = await this.prisma.category.findFirst({
          where: { OR: [{ slug: baseSlug }, { name: { equals: subCategory, mode: 'insensitive' }, parentId: parent.id }] },
          select: { id: true, slug: true },
        });
        if (existing) {
          duplicate++;
          existingSlugs.add(existing.slug);
          rows.push(createJobRow(job.id, rowNumber, 'DUPLICATE', 'SUBCATEGORY', existing.id, { category, subCategory }));
          continue;
        }

        const slug = generateUniqueSlug(subCategory, existingSlugs);
        const sub = await this.prisma.category.upsert({
          where: { slug },
          update: {
            name: subCategory,
            parentId: parent.id,
            seoTitle: `${subCategory} - TRADINGO B2B`,
            isActive: true,
          },
          create: {
            name: subCategory,
            slug,
            parentId: parent.id,
            seoTitle: `${subCategory} - TRADINGO B2B`,
            isActive: true,
          },
        });

        imported++;
        existingSlugs.add(slug);
        rows.push(createJobRow(job.id, rowNumber, 'IMPORTED', 'SUBCATEGORY', sub.id, { category, subCategory }));

        if (imported % BATCH_SIZE === 0) logProgress('Subcategories', i + 1, subcategoryEntries.length, imported, duplicate, error);
      } catch (err) {
        error++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Subcategory "${subCategory}": ${msg}`);
        rows.push(createJobRow(job.id, rowNumber, 'ERROR', 'SUBCATEGORY', undefined, { category, subCategory }, [msg]));
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
        summary: { total: subcategoryEntries.length, imported, duplicate, error },
      },
    });

    logProgress('Subcategories', subcategoryEntries.length, subcategoryEntries.length, imported, duplicate, error);
    return { jobId: job.id, status: finalStatus, imported, duplicate, skipped: 0, error, errors, summary: { total: subcategoryEntries.length } };
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

    const failedEntries: { category: string; subCategory: string }[] = [];
    for (const r of job.rows) {
      if (r.rawData && typeof r.rawData === 'object') {
        const d = r.rawData as Record<string, unknown>;
        if (d.category && d.subCategory) {
          failedEntries.push({ category: d.category as string, subCategory: d.subCategory as string });
        }
      }
    }
    return this.run(failedEntries);
  }

  async rollback(jobId: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'IMPORTED', entityType: 'SUBCATEGORY' }, select: { entityId: true } } },
    });
    if (!job) return { jobId, status: 'FAILED', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} not found`], summary: {} };

    await this.prisma.importJob.update({ where: { id: jobId }, data: { status: 'ROLLING_BACK' } });

    let rolledBack = 0;
    const errors: string[] = [];
    for (const row of job.rows) {
      if (!row.entityId) continue;
      try {
        await this.prisma.category.delete({ where: { id: row.entityId } });
        rolledBack++;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    await this.prisma.importJobRow.updateMany({
      where: { importJobId: jobId, status: 'IMPORTED', entityType: 'SUBCATEGORY' },
      data: { status: 'ROLLED_BACK' },
    });

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'ROLLED_BACK', rolledBackAt: new Date(), summary: { rolledBack, total: job.rows.length } },
    });

    return { jobId, status: 'ROLLED_BACK', imported: rolledBack, duplicate: 0, skipped: 0, error: errors.length, errors, summary: { rolledBack, total: job.rows.length } };
  }
}
