import { CategoriesSeeder } from '../categories.seed';

function mockPrisma() {
  return {
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: `cat-${create.slug}`, ...create })),
      delete: jest.fn().mockResolvedValue({}),
    },
    importJob: {
      create: jest.fn().mockResolvedValue({ id: 'job-1', status: 'RUNNING' }),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    importJobRow: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    productMaster: { findMany: jest.fn().mockResolvedValue([]) },
    serviceMaster: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('CategoriesSeeder', () => {
  let seeder: CategoriesSeeder;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma() as any;
    seeder = new CategoriesSeeder(prisma as any);
  });

  it('should create categories', async () => {
    const result = await seeder.run(['Electronics', 'Clothing']);
    expect(result.imported).toBe(2);
    expect(result.status).toBe('COMPLETED');
    expect(prisma.importJob.create).toHaveBeenCalled();
    expect(prisma.category.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.importJobRow.createMany).toHaveBeenCalled();
    expect(prisma.importJob.update).toHaveBeenCalled();
  });

  it('should handle idempotency - skip existing categories', async () => {
    prisma.category.findMany.mockResolvedValue([{ slug: 'electronics' }]);
    prisma.category.findFirst.mockImplementation(async ({ where }: any) => {
      const slug = where?.OR?.[0]?.slug || where?.slug || '';
      if (slug === 'electronics' || slug?.startsWith('electronics')) return { id: 'cat-1', slug: 'electronics' };
      return null;
    });
    const result = await seeder.run(['Electronics', 'Clothing']);
    expect(result.imported).toBe(1);
    expect(result.duplicate).toBe(1);
    expect(result.status).toBe('COMPLETED');
  });

  it('should handle db errors gracefully', async () => {
    prisma.category.upsert.mockRejectedValue(new Error('DB error'));
    const result = await seeder.run(['Electronics']);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return PARTIAL on partial failures', async () => {
    prisma.category.upsert
      .mockResolvedValueOnce({ id: 'cat-1', name: 'Electronics' })
      .mockRejectedValueOnce(new Error('fail'));
    const result = await seeder.run(['Electronics', 'Fashion']);
    expect(result.status).toBe('PARTIAL');
    expect(result.imported).toBe(1);
    expect(result.error).toBe(1);
  });

  it('should resume from failed rows', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'FAILED',
      rows: [{ rawData: { name: 'FailedCat' } }],
    });
    const result = await seeder.resume('job-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should return FAILED for non-existent resume', async () => {
    prisma.importJob.findUnique.mockResolvedValue(null);
    const result = await seeder.resume('missing');
    expect(result.status).toBe('FAILED');
  });

  it('should not resume completed jobs', async () => {
    prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'COMPLETED', rows: [] });
    const result = await seeder.resume('job-1');
    expect(result.errors[0]).toContain('COMPLETED');
  });

  it('should rollback imported categories', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      rows: [{ entityId: 'cat-1' }, { entityId: 'cat-2' }],
    });
    const result = await seeder.rollback('job-1');
    expect(result.status).toBe('ROLLED_BACK');
    expect(result.imported).toBe(2);
    expect(prisma.category.delete).toHaveBeenCalledTimes(2);
  });

  it('should fail rollback for non-existent job', async () => {
    prisma.importJob.findUnique.mockResolvedValue(null);
    const result = await seeder.rollback('missing');
    expect(result.status).toBe('FAILED');
  });
});
