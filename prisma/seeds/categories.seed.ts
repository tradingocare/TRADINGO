import { PrismaClient } from '@prisma/client';
import { SeedResult, slugify, generateUniqueSlug, BATCH_SIZE, logProgress, createJobRow, ImportJobRowInsert } from './seed.utils.ts';

export class CategoriesSeeder {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async run(categories: string[]): Promise<SeedResult> {
    const existingSlugs = new Set(
      (await this.prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug),
    );

    const job = await this.prisma.importJob.create({
      data: {
        type: 'CATEGORY',
        status: 'RUNNING',
        totalRows: categories.length,
        startedAt: new Date(),
      },
    });

    const rows: ImportJobRowInsert[] = [];
    let imported = 0;
    let duplicate = 0;
    let error = 0;
    const errors: string[] = [];

    for (let i = 0; i < categories.length; i++) {
      const name = categories[i];
      const rowNumber = i + 1;
      const baseSlug = slugify(name);

      try {
        const existing = await this.prisma.category.findFirst({
          where: { OR: [{ slug: baseSlug }, { name: { equals: name, mode: 'insensitive' } }] },
          select: { id: true, slug: true },
        });

        if (existing) {
          duplicate++;
          existingSlugs.add(existing.slug);
          rows.push(createJobRow(job.id, rowNumber, 'DUPLICATE', 'CATEGORY', existing.id, { name }));
          continue;
        }

        const slug = generateUniqueSlug(name, existingSlugs);
        const category = await this.prisma.category.upsert({
          where: { slug },
          update: {
            name,
            seoTitle: `${name} - TRADINGO B2B Marketplace`,
            seoDescription: `Find top ${name.toLowerCase()} suppliers, manufacturers, and exporters in India on TRADINGO B2B marketplace.`,
            isActive: true,
          },
          create: {
            name,
            slug,
            seoTitle: `${name} - TRADINGO B2B Marketplace`,
            seoDescription: `Find top ${name.toLowerCase()} suppliers, manufacturers, and exporters in India on TRADINGO B2B marketplace.`,
            isActive: true,
          },
        });

        imported++;
        existingSlugs.add(slug);
        rows.push(createJobRow(job.id, rowNumber, 'IMPORTED', 'CATEGORY', category.id, { name }));

        if (imported % BATCH_SIZE === 0) logProgress('Categories', i + 1, categories.length, imported, duplicate, error);
      } catch (err) {
        error++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Category "${name}": ${msg}`);
        rows.push(createJobRow(job.id, rowNumber, 'ERROR', 'CATEGORY', undefined, { name }, [msg]));
      }
    }

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await this.prisma.importJobRow.createMany({ data: rows.slice(i, i + BATCH_SIZE) as any });
    }

    const finalStatus: ImportJobStatus = error > 0 ? (imported > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED';
    await this.prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        importedRows: imported,
        duplicateRows: duplicate,
        errorRows: error,
        completedAt: new Date(),
        summary: { total: categories.length, imported, duplicate, error },
      },
    });

    logProgress('Categories', categories.length, categories.length, imported, duplicate, error);
    return { jobId: job.id, status: finalStatus, imported, duplicate, skipped: 0, error, errors, summary: { total: categories.length } };
  }

  async resume(jobId: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'ERROR' }, select: { rawData: true } } },
    });
    if (!job) return { jobId, status: 'FAILED', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} not found`], summary: {} };
    if (job.status !== 'FAILED' && job.status !== 'PARTIAL') {
      return { jobId, status: job.status as ImportJobStatus, imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} is ${job.status}, cannot resume`], summary: {} };
    }

    const failedNames: string[] = [];
    for (const r of job.rows) {
      if (r.rawData && typeof r.rawData === 'object') {
        const d = r.rawData as Record<string, unknown>;
        if (d.name) failedNames.push(d.name as string);
      }
    }
    return this.run(failedNames);
  }

  async rollback(jobId: string): Promise<SeedResult> {
    return this.rollbackGeneric(jobId, 'CATEGORY');
  }

  protected async rollbackGeneric(jobId: string, entityType: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'IMPORTED', entityType }, select: { entityId: true } } },
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
      where: { importJobId: jobId, status: 'IMPORTED', entityType },
      data: { status: 'ROLLED_BACK' },
    });

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'ROLLED_BACK', rolledBackAt: new Date(), summary: { rolledBack, total: job.rows.length } },
    });

    return { jobId, status: 'ROLLED_BACK', imported: rolledBack, duplicate: 0, skipped: 0, error: errors.length, errors, summary: { rolledBack, total: job.rows.length } };
  }
}

type ImportJobStatus = 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'ROLLING_BACK' | 'ROLLED_BACK' | 'RUNNING' | 'PENDING';
