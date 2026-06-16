import { CatalogImportSeeder } from '../catalog-import.seed';

function mockPrisma() {
  return {
    importJob: {
      create: jest.fn().mockResolvedValue({ id: 'job-1', status: 'RUNNING' }),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    importJobRow: {
      create: jest.fn().mockResolvedValue({ id: 'row-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe('CatalogImportSeeder', () => {
  let seeder: CatalogImportSeeder;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma() as any;
    seeder = new CatalogImportSeeder(prisma as any);
  });

  it('should record seed metadata', async () => {
    const meta = { categoryCount: 10, subcategoryCount: 20, productMasterCount: 100, serviceMasterCount: 50 };
    const result = await seeder.run(meta);
    expect(result.status).toBe('COMPLETED');
    expect(result.imported).toBe(1);
    expect(prisma.importJob.create).toHaveBeenCalled();
    expect(prisma.importJobRow.create).toHaveBeenCalled();
    expect(prisma.importJob.update).toHaveBeenCalled();
  });

  it('should handle db error during metadata creation', async () => {
    prisma.importJobRow.create.mockRejectedValue(new Error('DB error'));
    const meta = { categoryCount: 5, subcategoryCount: 10, productMasterCount: 50, serviceMasterCount: 25 };
    const result = await seeder.run(meta);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should rollback metadata job', async () => {
    prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'COMPLETED' });
    const result = await seeder.rollback('job-1');
    expect(result.status).toBe('ROLLED_BACK');
    expect(prisma.importJobRow.deleteMany).toHaveBeenCalledWith({ where: { importJobId: 'job-1' } });
    expect(prisma.importJob.delete).toHaveBeenCalledWith({ where: { id: 'job-1' } });
  });

  it('should fail rollback for non-existent job', async () => {
    prisma.importJob.findUnique.mockResolvedValue(null);
    const result = await seeder.rollback('missing');
    expect(result.status).toBe('FAILED');
  });
});
