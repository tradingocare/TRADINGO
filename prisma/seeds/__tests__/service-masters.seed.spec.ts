import { ServiceMastersSeeder } from '../service-masters.seed';

function mockPrisma() {
  return {
    serviceMaster: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: `sm-${create.slug}`, ...create })),
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
    productMaster: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('ServiceMastersSeeder', () => {
  let seeder: ServiceMastersSeeder;
  let prisma: ReturnType<typeof mockPrisma>;

  const sampleRows = [
    { serialNo: 1, category: 'Accounting', subCategory: 'Tax', name: 'Audit Service', type: 'Service' as const, unit: 'Per Project', altUnits: '', quantityParams: '1' },
    { serialNo: 2, category: 'Consulting', subCategory: 'IT', name: 'IT Consulting', type: 'Service' as const, unit: 'Per Hour', altUnits: '', quantityParams: '1' },
  ];

  beforeEach(() => {
    prisma = mockPrisma() as any;
    seeder = new ServiceMastersSeeder(prisma as any);
  });

  it('should create service masters', async () => {
    const result = await seeder.run(sampleRows);
    expect(result.imported).toBe(2);
    expect(result.status).toBe('COMPLETED');
    expect(prisma.serviceMaster.upsert).toHaveBeenCalledTimes(2);
  });

  it('should handle idempotency - skip duplicates', async () => {
    prisma.serviceMaster.findMany.mockResolvedValue([{ slug: 'audit-service' }]);
    prisma.serviceMaster.findFirst.mockImplementation(async ({ where }: any) => {
      const slug = where?.OR?.[0]?.slug || '';
      if (slug === 'audit-service' || slug?.startsWith('audit')) return { id: 'sm-1', slug: 'audit-service' };
      return null;
    });
    const result = await seeder.run(sampleRows);
    expect(result.duplicate).toBe(1);
    expect(result.imported).toBe(1);
  });

  it('should handle db errors', async () => {
    prisma.serviceMaster.upsert.mockRejectedValue(new Error('DB error'));
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

  it('should rollback service masters', async () => {
    prisma.importJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      rows: [{ entityId: 'sm-1' }],
    });
    prisma.serviceMaster.findUnique.mockResolvedValue({ id: 'sm-id-1' });
    const result = await seeder.rollback('job-1');
    expect(result.status).toBe('ROLLED_BACK');
  });
});
