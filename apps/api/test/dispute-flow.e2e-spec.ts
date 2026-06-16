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
import { EventIngestionService } from '../src/modules/analytics/event-ingestion.service';
import { ClickhouseService } from '../src/modules/analytics/clickhouse.service';
import { NotificationService } from '../src/modules/notification/notification.service';

jest.mock('bullmq', () => {
  const original = jest.requireActual('bullmq');
  class MockWorker { on = jest.fn(); async close() {} }
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

describe('Dispute & Resolution Flow (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: Record<string, any>;
  let mockJwt: Record<string, jest.Mock>;

  beforeAll(async () => {
    mockPrisma = {
      $transaction: jest.fn((cb: any) => cb(mockPrisma)),
      user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      session: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
      company: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      order: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      escrow: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), count: jest.fn() },
      dispute: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      disputeTimelineEvent: { create: jest.fn(), findMany: jest.fn() },
      disputeEvidence: { create: jest.fn(), findMany: jest.fn() },
      disputeResolution: { create: jest.fn() },
      disputeMessage: { create: jest.fn(), findMany: jest.fn() },
      disputeAppeal: { create: jest.fn(), findFirst: jest.fn() },
      disputeProcessorExecution: { findUnique: jest.fn(), create: jest.fn() },
      settlement: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      notification: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    mockJwt = {
      sign: jest.fn().mockReturnValue('e2e-token'),
      verify: jest.fn().mockReturnValue({ sub: 'admin-1', sessionId: 'e2e-session' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService).useValue(mockPrisma)
      .overrideProvider(RedisService).useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() })
      .overrideProvider(JwtService).useValue(mockJwt)
      .overrideProvider(SearchService).useValue({ indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() })
      .overrideProvider(EventIngestionService).useValue({ track: jest.fn(), trackBatch: jest.fn() })
      .overrideProvider(ClickhouseService).useValue({ insert: jest.fn(), query: jest.fn(), exec: jest.fn(), ping: jest.fn() })
      .overrideProvider(NotificationService).useValue({ createWithTemplate: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(getQueueToken('email')).useValue(mockQueue())
      .overrideProvider(getQueueToken('export')).useValue(mockQueue())
      .overrideProvider(getQueueToken('notification')).useValue(mockQueue())
      .overrideProvider(getQueueToken('certification')).useValue(mockQueue())
      .overrideProvider(getQueueToken('subscription')).useValue(mockQueue())
      .overrideProvider(getQueueToken('rfq')).useValue(mockQueue())
      .overrideProvider(getQueueToken('escrow')).useValue(mockQueue())
      .overrideProvider(getQueueToken('settlement')).useValue(mockQueue())
      .overrideProvider(getQueueToken('dispute')).useValue(mockQueue())
      .overrideProvider(getQueueToken('analytics')).useValue(mockQueue())
      .overrideGuard(JwtAuthGuard).useValue({
        canActivate: jest.fn((context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: 'admin-1', email: 'admin@test.com', role: 'ADMIN', permissions: [], companyOwners: [{ companyId: 'company-1' }] };
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

  const auth = 'Bearer e2e-token';
  const companyId = '11111111-1111-4111-a111-111111111111';
  const orderId = '22222222-2222-4222-a222-222222222222';
  const disputeId = '33333333-3333-4333-a333-333333333333';
  const escrowId = '44444444-4444-4444-a444-444444444444';
  const settlementId = '55555555-5555-4555-a555-555555555555';

  describe('14. Dispute Creation', () => {
    it('creates dispute for an order', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'buyer-1', companyOwners: [{ companyId }] });
      mockPrisma.order.findUnique.mockResolvedValue({ id: orderId, orderNumber: 'ORD-001', buyerCompanyId: companyId, sellerCompanyId: 'seller-1', status: 'PAID', deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });
      mockPrisma.escrow.findUnique.mockResolvedValue(null);
      mockPrisma.dispute.create.mockResolvedValue({
        id: disputeId, orderId, raisedByCompanyId: companyId, againstCompanyId: 'seller-1', status: 'OPEN', reason: 'QUALITY_ISSUE', type: 'PRODUCT', description: 'Products do not match specification',
      });
      mockPrisma.dispute.findUnique.mockResolvedValue({
        id: disputeId, orderId, raisedByCompanyId: companyId, againstCompanyId: 'seller-1', status: 'OPEN', reason: 'QUALITY_ISSUE', type: 'PRODUCT', description: 'Products do not match specification',
        order: { orderNumber: 'ORD-001' }, messages: [], evidence: [], timeline: [], resolution: null, appeal: null,
      });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${companyId}/disputes`)
        .set('Authorization', auth)
        .send({ orderId, type: 'PRODUCT', reason: 'QUALITY_ISSUE', description: 'Products do not match specification' })
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('OPEN');
    });
  });

  describe('15. Evidence Submission', () => {
    it('submits evidence for dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({ id: disputeId, status: 'OPEN', raisedByCompanyId: companyId, evidence: [] });
      mockPrisma.disputeEvidence.create.mockResolvedValue({
        id: 'doc-1', disputeId, fileName: 'evidence.pdf', fileUrl: 'https://s3.test/evidence.pdf', uploadedBy: 'buyer-1',
      });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${companyId}/disputes/${disputeId}/evidence`)
        .set('Authorization', auth)
        .send({ fileName: 'evidence.pdf', fileUrl: 'https://s3.test/evidence.pdf' })
        .expect(201);
      expect(res.body.fileUrl).toContain('evidence.pdf');
    });
  });

  describe('16. Arbitration', () => {
    it('escalates to admin arbitration', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({ id: disputeId, status: 'UNDER_REVIEW', raisedByCompanyId: companyId, orderId, againstCompanyId: 'seller-1' });
      mockPrisma.dispute.update.mockResolvedValue({ id: disputeId, status: 'ESCALATED', escalatedAt: new Date().toISOString() });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${companyId}/disputes/${disputeId}/escalate`)
        .set('Authorization', auth)
        .send({ reason: 'Cannot resolve through negotiation' })
        .expect(201);
      expect(res.body.status).toBe('ESCALATED');
    });
  });

  describe('17. Dispute Resolution & Refund', () => {
    it('resolves dispute in favor of buyer with refund', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({ id: disputeId, status: 'ADMIN_ARBITRATION', orderId, raisedByCompanyId: companyId, againstCompanyId: 'seller-1', disputeNumber: 'DSP-001', resolution: null });
      mockPrisma.disputeResolution.create.mockResolvedValue({ id: 'res-1', disputeId, resolutionType: 'FULL_REFUND', approvedBy: 'admin-1' });
      mockPrisma.dispute.update.mockResolvedValue({ id: disputeId, status: 'REFUNDED', refundedAt: new Date().toISOString() });
      mockPrisma.escrow.findUnique.mockResolvedValue({ id: escrowId, status: 'HELD', amount: 5000 });
      mockPrisma.escrow.update.mockResolvedValue({ id: escrowId, status: 'REFUNDED' });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${companyId}/disputes/${disputeId}/resolve`)
        .set('Authorization', auth)
        .send({ resolutionType: 'FULL_REFUND', notes: 'Product quality issue confirmed' })
        .expect(201);
      expect(res.body.dispute.status).toBe('REFUNDED');
    });
  });
});
