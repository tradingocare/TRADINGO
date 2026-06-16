import { PrismaClient } from '@prisma/client';
import { SeedResult } from './seed.utils.ts';

export interface SeedMetadata {
  [key: string]: unknown;
  categoryCount: number;
  subcategoryCount: number;
  productMasterCount: number;
  serviceMasterCount: number;
}

export class CatalogImportSeeder {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async run(metadata: SeedMetadata): Promise<SeedResult> {
    const job = await this.prisma.importJob.create({
      data: {
        type: 'CATEGORY',
        status: 'RUNNING',
        totalRows: 1,
        startedAt: new Date(),
      },
    });

    const errors: string[] = [];
    try {
      const row = await this.prisma.importJobRow.create({
        data: {
          importJobId: job.id,
          rowNumber: 1,
          status: 'IMPORTED',
          entityType: 'CATALOG_SEED',
          rawData: { metadata } as any,
        },
      });

      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          importedRows: 1,
          completedAt: new Date(),
          summary: { metadata, rowId: row.id } as any,
        },
      });

      console.log(`[CatalogImport] Metadata recorded: ${JSON.stringify(metadata)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', errorLog: msg, completedAt: new Date() },
      });
    }

    return {
      jobId: job.id,
      status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
      imported: errors.length > 0 ? 0 : 1,
      duplicate: 0,
      skipped: 0,
      error: errors.length,
      errors,
      summary: { metadata },
    };
  }

  async rollback(jobId: string): Promise<SeedResult> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) return { jobId, status: 'FAILED', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [`Job ${jobId} not found`], summary: {} };

    await this.prisma.importJobRow.deleteMany({ where: { importJobId: jobId } });
    await this.prisma.importJob.delete({ where: { id: jobId } });

    return { jobId, status: 'ROLLED_BACK', imported: 0, duplicate: 0, skipped: 0, error: 0, errors: [], summary: {} };
  }
}
