import { SubcategoriesSeeder } from '../subcategories.seed';

function mockPrisma() {
  return {
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: `sub-${create.slug}`, ...create })),
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

describe('SubcategoriesSeeder', () => {
  let seeder: SubcategoriesSeeder;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma() as any;
    seeder = new SubcategoriesSeeder(prisma as any);
  });

  it('should create subcategories under parent categories', async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: 'parent-1' }) // entry 1 parent lookup
      .mockResolvedValueOnce(null)                // entry 1 duplicate check
      .mockResolvedValueOnce({ id: 'parent-1' }) // entry 2 parent lookup
      .mockResolvedValue(null);                  // entry 2 duplicate check
    const entries = [
      { category: 'Electronics', subCategory: 'Mobiles' },
      { category: 'Electronics', subCategory: 'Laptops' },
    ];
    const result = await seeder.run(entries);
    expect(result.imported).toBe(2);
    expect(result.status).toBe('COMPLETED');
    expect(prisma.category.upsert).toHaveBeenCalledTimes(2);
  });

  it('should handle missing parent category', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    const entries = [{ category: 'MissingCat', subCategory: 'Sub' }];
    const result = await seeder.run(entries);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle idempotency - skip duplicate subcategories', async () => {
    prisma.category.findMany.mockResolvedValue([{ slug: 'mobiles' }]);
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: 'parent-1' })
      .mockResolvedValue({ id: 'sub-1', slug: 'mobiles' });
    const entries = [{ category: 'Electronics', subCategory: 'Mobiles' }];
    const result = await seeder.run(entries);
    expect(result.duplicate).toBe(1);
    expect(result.imported).toBe(0);
  });

  it('should handle db errors', async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: 'parent-1' })
      .mockResolvedValue(null);
    prisma.category.upsert.mockRejectedValue(new Error('DB error'));
    const entries = [{ category: 'Electronics', subCategory: 'Mobiles' }];
    const result = await seeder.run(entries);
    expect(result.status).toBe('FAILED');
  });

  it('should resume from failed rows', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'PARTIAL',
      rows: [{ rawData: { category: 'Electronics', subCategory: 'FailedSub' } }],
    });
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: 'parent-1' })
      .mockResolvedValue(null);
    const result = await seeder.resume('job-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should rollback subcategories', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      rows: [{ entityId: 'sub-1' }],
    });
    const result = await seeder.rollback('job-1');
    expect(result.status).toBe('ROLLED_BACK');
  });
});
