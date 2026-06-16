import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
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

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => ({ index: jest.fn(), search: jest.fn(), delete: jest.fn() })),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('e2e-session-id') }));

const mockQueue = () => ({
  add: jest.fn().mockResolvedValue(undefined),
  opts: {},
  upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  getJob: jest.fn().mockResolvedValue(null),
  getJobs: jest.fn().mockResolvedValue([]),
  getRepeatableJobs: jest.fn().mockResolvedValue([]),
  getJobCounts: jest.fn().mockResolvedValue({}),
  obliterate: jest.fn().mockResolvedValue(undefined),
  drain: jest.fn().mockResolvedValue(undefined),
  clean: jest.fn().mockResolvedValue([]),
});

describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: Record<string, Record<string, jest.Mock>>;
  let mockRedis: Record<string, jest.Mock>;
  let mockJwt: Record<string, jest.Mock>;

  beforeAll(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      session: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    };
    mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() };
    mockJwt = { sign: jest.fn().mockReturnValue('e2e-access-token'), verify: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .overrideProvider(JwtService)
      .useValue(mockJwt)
      .overrideProvider(SearchService)
      .useValue({ indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() })
      .overrideProvider(getQueueToken('email'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('export'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('notification'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('certification'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('subscription'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('rfq'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('escrow'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('settlement'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('dispute'))
      .useValue(mockQueue())
      .overrideProvider(getQueueToken('analytics'))
      .useValue(mockQueue())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'e2e-user-1', email: 'e2e@test.com', name: 'E2E Tester', role: 'USER' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'e2e@test.com', password: 'ComplexP@ss1', name: 'E2E Tester' })
      expect(res.status).toBe(201);

      expect(res.body.user.email).toBe('e2e@test.com');
      expect(res.body.accessToken).toBe('e2e-access-token');
      expect(res.body.refreshToken).toBe('e2e-access-token');
    });

    it('returns 409 for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'existing@test.com', password: 'ComplexP@ss1', name: 'Existing' })
        .expect(409);
    });

    it('returns 400 for invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'short', name: '' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'e2e-user-1', email: 'e2e@test.com', name: 'E2E', role: 'USER', passwordHash: 'hash', isActive: true, loginAttempts: 0, lockedUntil: null, permissions: [] });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@test.com', password: 'ComplexP@ss1' })
        .expect(200);

      expect(res.body.user.email).toBe('e2e@test.com');
      expect(res.body.accessToken).toBe('e2e-access-token');
    });

    it('returns 401 for invalid credentials', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@test.com', password: 'WrongP@ss1' })
        .expect(401);
    });

    it('returns 400 for validation errors', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'invalid', password: 'short' })
        .expect(400);
    });
  });
});
