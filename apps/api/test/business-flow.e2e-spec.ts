import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/common/services/redis.service';
import { SearchService } from '../src/modules/search/search.service';

// Mock BullMQ Worker to prevent Redis connection requirements
jest.mock('bullmq', () => {
  const original = jest.requireActual('bullmq');
  class MockWorker {
    on: jest.Mock;
    constructor() { this.on = jest.fn(); }
    async close() { /* no-op */ }
  }
  return { ...original, Worker: MockWorker };
});

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('e2e-uuid') }));
jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => ({ index: jest.fn(), search: jest.fn(), delete: jest.fn() })),
}));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue({ toString: jest.fn().mockReturnValue('e2e-token') }),
  createHash: jest.fn().mockReturnValue({ update: jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue('e2e-hash') }) }),
}));

describe('Business Flow (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: Record<string, Record<string, jest.Mock>>;
  let mockSearch: Record<string, jest.Mock>;
  let mockJwt: Record<string, jest.Mock>;

  beforeAll(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      session: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
      organization: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      organizationMember: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn(), update: jest.fn() },
      organizationInvitation: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      company: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      companyOwner: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
      product: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      productInventory: { upsert: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    mockSearch = { indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() };
    mockJwt = {
      sign: jest.fn().mockReturnValue('e2e-access-token'),
      verify: jest.fn().mockReturnValue({ sub: 'e2e-user-1', sessionId: 'e2e-session' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() })
      .overrideProvider(JwtService)
      .useValue(mockJwt)
      .overrideProvider(SearchService)
      .useValue(mockSearch)
      .overrideProvider(getQueueToken('email'))
      .useValue({ add: jest.fn(), opts: { connection: {} } })
      .overrideProvider(getQueueToken('export'))
      .useValue({ add: jest.fn(), opts: { connection: {} } })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers?.authorization;
          if (!authHeader) throw new UnauthorizedException();
          req.user = { sub: 'e2e-user-1', email: 'e2e@test.com', role: 'SUPER_ADMIN', permissions: [] };
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/organizations (Create Organization)', () => {
    const authHeader = 'Bearer e2e-access-token';

    it('creates organization for authenticated user', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue({
        id: 'e2e-org-1', name: 'E2E Org', slug: 'e2e-org',
        createdBy: 'e2e-user-1', updatedBy: 'e2e-user-1',
        members: [{ userId: 'e2e-user-1', role: 'OWNER', invitedBy: 'e2e-user-1', user: { id: 'e2e-user-1', email: 'e2e@test.com', name: 'E2E' } }],
        _count: { members: 1, companies: 0 },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', authHeader)
        .send({ name: 'E2E Org', description: 'Created in e2e test', email: 'org@e2e.com' })
        .expect(201);

      expect(res.body.name).toBe('E2E Org');
      expect(res.body.slug).toBe('e2e-org');
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .send({ name: 'No Auth Org' })
        .expect(401);
    });
  });

  describe('POST /api/v1/companies (Create Company)', () => {
    const authHeader = 'Bearer e2e-access-token';

    it('creates company for authenticated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'e2e-user-1', role: 'SUPER_ADMIN' });
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.company.create.mockResolvedValue({
        id: 'e2e-company-1', name: 'E2E Company', slug: 'e2e-company',
        owners: [{ userId: 'e2e-user-1', isPrimary: true, user: { id: 'e2e-user-1', email: 'e2e@test.com', name: 'E2E' } }],
        locations: [], categories: [],
        trustScore: 0, verificationLevel: 'UNVERIFIED',
        status: 'ACTIVE',
      });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/v1/companies')
        .set('Authorization', authHeader)
        .send({
          name: 'E2E Company',
          organizationId: 'e2e-org-1',
          businessType: 'MANUFACTURER',
          email: 'company@e2e.com',
          status: 'ACTIVE',
        })
        .expect(201);

      expect(res.body.name).toBe('E2E Company');
    });
  });

  describe('POST /api/v1/products (Create Product)', () => {
    const authHeader = 'Bearer e2e-access-token';

    it('creates product for authenticated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'e2e-user-1', role: 'SUPER_ADMIN' });
      mockPrisma.company.findFirst.mockResolvedValue({ id: '11111111-1111-4111-a111-111111111111', slug: 'e2e-company', trustScore: 80, verificationLevel: 'LEVEL_2' });
      mockPrisma.product.create.mockResolvedValue({
        id: 'e2e-product-1', name: 'E2E Product', slug: 'e2e-company-e2e-product',
        company: { id: '11111111-1111-4111-a111-111111111111', name: 'E2E Company', slug: 'e2e-company' },
        category: null, industry: null,
        media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', authHeader)
        .send({
          companyId: '11111111-1111-4111-a111-111111111111',
          name: 'E2E Product',
          shortDescription: 'An e2e test product',
          productType: 'PHYSICAL',
          status: 'DRAFT',
          moq: 1,
          unit: 'piece',
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('E2E Product');
    });
  });

  describe('GET /api/v1/products/search (Product Search)', () => {
    it('searches products publicly without auth', async () => {
      mockSearch.search.mockResolvedValue({
        hits: [{ id: 'e2e-product-1' }],
        total: 1, page: 1, limit: 50,
      });
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'e2e-product-1', name: 'E2E Product', slug: 'e2e-product',
          company: { id: '11111111-1111-4111-a111-111111111111', name: 'E2E Company', slug: 'e2e-company', logo: null, trustScore: 80, verificationLevel: 'LEVEL_1' },
          category: null, industry: null, media: [], inventory: null, priceSlabs: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({ q: 'E2E', categoryId: 'cat-1' })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('returns empty results for no matches', async () => {
      mockSearch.search.mockResolvedValue({ hits: [], total: 0, page: 1, limit: 50 });

      const res = await request(app.getHttpServer())
        .get('/api/v1/products/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });
  });
});
