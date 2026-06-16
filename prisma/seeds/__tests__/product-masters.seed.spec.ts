import { ProductMastersSeeder } from '../product-masters.seed';

function mockPrisma() {
  return {
    productMaster: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: `pm-${create.slug}`, ...create })),
      delete: jest.fn().mockResolvedValue({}),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue({ id: 'cat-1' }),
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
    serviceMaster: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('ProductMastersSeeder', () => {
  let seeder: ProductMastersSeeder;
  let prisma: ReturnType<typeof mockPrisma>;

  const sampleRows = [
    { serialNo: 1, category: 'Electronics', subCategory: 'Mobiles', name: 'Smartphone X', type: 'Product' as const, unit: 'Piece', altUnits: 'Box', quantityParams: '100' },
    { serialNo: 2, category: 'Electronics', subCategory: 'Laptops', name: 'Gaming Laptop', type: 'Product' as const, unit: 'Piece', altUnits: 'Carton', quantityParams: '50' },
  ];

  beforeEach(() => {
    prisma = mockPrisma() as any;
    seeder = new ProductMastersSeeder(prisma as any);
  });

  it('should create product masters', async () => {
    const result = await seeder.run(sampleRows);
    expect(result.imported).toBe(2);
    expect(result.status).toBe('COMPLETED');
    expect(prisma.productMaster.upsert).toHaveBeenCalledTimes(2);
  });

  it('should handle idempotency - skip duplicates', async () => {
    prisma.productMaster.findMany.mockResolvedValue([{ slug: 'smartphone-x' }]);
    prisma.productMaster.findFirst.mockImplementation(async ({ where }: any) => {
      const slug = where?.OR?.[0]?.slug || '';
      if (slug === 'smartphone-x' || slug?.startsWith('smartphone')) return { id: 'pm-1', slug: 'smartphone-x' };
      return null;
    });
    const result = await seeder.run(sampleRows);
    expect(result.duplicate).toBe(1);
    expect(result.imported).toBe(1);
  });

  it('should handle db errors', async () => {
    prisma.productMaster.upsert.mockRejectedValue(new Error('DB error'));
    const result = await seeder.run(sampleRows);
    expect(result.status).toBe('FAILED');
  });

  it('should handle empty input', async () => {
    const result = await seeder.run([]);
    expect(result.status).toBe('COMPLETED');
    expect(result.imported).toBe(0);
  });

  it('should resume from failed rows', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'PARTIAL',
      rows: [{ rawData: sampleRows[0] }],
    });
    const result = await seeder.resume('job-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('should rollback product masters', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      rows: [{ entityId: 'pm-1' }],
    });
    prisma.productMaster.findUnique.mockResolvedValue({ id: 'pm-id-1' });
    const result = await seeder.rollback('job-1');
    expect(result.status).toBe('ROLLED_BACK');
  });
});
