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
import { RazorpayService } from '../src/modules/payment/razorpay.service';

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

describe('Full Trade Flow (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: Record<string, any>;
  let mockSearch: Record<string, jest.Mock>;
  let mockJwt: Record<string, jest.Mock>;

  const COMPANY_1 = '11111111-1111-4111-a111-111111111111';
  const COMPANY_2 = '22222222-2222-4222-a222-222222222222';
  const ESCROW_1 = '33333333-3333-4333-a333-333333333333';
  const ORDER_1 = '44444444-4444-4444-a444-444444444444';
  const PRODUCT_1 = '55555555-5555-4555-a555-555555555555';
  const SETT_1 = '66666666-6666-4666-a666-666666666666';
  const QUOTE_1 = '77777777-7777-4777-a777-777777777777';
  const RFQ_1 = '88888888-8888-4888-a888-888888888888';
  const VER_1 = '99999999-9999-4999-a999-999999999999';
  const GOCASH_1 = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const TRADGO_1 = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  const PAY_1 = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

  beforeAll(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      session: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
      company: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      companyLocation: { findFirst: jest.fn(), findMany: jest.fn() },
      companyOwner: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
      companyVerification: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      organization: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      organizationMember: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
      organizationInvitation: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      product: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      productInventory: { upsert: jest.fn() },
      rfq: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      rfqProduct: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
      rfqVendorMatch: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      rfqView: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      quote: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
      order: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      orderTimelineEvent: { create: jest.fn(), findMany: jest.fn() },
      orderDocument: { create: jest.fn(), findMany: jest.fn() },
      payment: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      escrow: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      escrowEvent: { create: jest.fn() },
      settlement: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      settlementEvent: { create: jest.fn() },
      goCashTransaction: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      goCashBalance: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
      tradGoTransaction: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      tradGoBalance: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
      auditLog: { create: jest.fn() },
      rfqNumberCounter: { upsert: jest.fn() },
      orderNumberCounter: { upsert: jest.fn().mockResolvedValue({ seq: 1 }) },
      notificationTemplate: { findUnique: jest.fn().mockResolvedValue({ id: 'nt-1', title: 'Notification', body: 'Your RFQ has been created', subject: '' }) },
      chatEvent: { create: jest.fn() },
      notification: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      notificationDelivery: { create: jest.fn(), updateMany: jest.fn() },
      notificationPreference: { findMany: jest.fn().mockResolvedValue([]) },
      subscription: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      creditPack: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
      rfqCreditLedger: { groupBy: jest.fn().mockResolvedValue([{ type: 'PURCHASE', _sum: { amount: 10 } }]), create: jest.fn() },
      rfqAnalyticsEvent: { create: jest.fn() },
      quoteEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }) },
      orderAnalyticsEvent: { create: jest.fn(), createMany: jest.fn() },
      sellerAnalyticsEvent: { findMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(mockPrisma)),
    };
    mockSearch = { indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() };
    mockJwt = {
      sign: jest.fn().mockReturnValue('e2e-access-token'),
      verify: jest.fn().mockReturnValue({ sub: 'e2e-user-1', sessionId: 'e2e-session' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService).useValue(mockPrisma)
      .overrideProvider(RedisService).useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn(), exists: jest.fn(), incr: jest.fn(), expire: jest.fn() })
      .overrideProvider(JwtService).useValue(mockJwt)
      .overrideProvider(SearchService).useValue(mockSearch)
      .overrideProvider(EventIngestionService).useValue({ track: jest.fn(), trackBatch: jest.fn() })
      .overrideProvider(ClickhouseService).useValue({ insert: jest.fn(), query: jest.fn(), exec: jest.fn(), ping: jest.fn() })
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
      .overrideProvider(RazorpayService).useValue({
        createOrder: jest.fn().mockResolvedValue({ id: 'rzp_order_123', amount: 500000, currency: 'INR' }),
        getKeyId: jest.fn().mockReturnValue('rzp_test_key'),
        verifyPayment: jest.fn().mockReturnValue(true),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers?.authorization;
          if (!authHeader) throw new UnauthorizedException();
          req.user = { sub: 'e2e-user-1', email: 'buyer@test.com', role: 'SUPER_ADMIN', permissions: [] };
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

  describe('1. Buyer & Seller Registration', () => {
    it('registers buyer user', async () => {
      jest.setTimeout(30000);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'buyer-1', email: 'buyer@test.com', name: 'Buyer', role: 'USER' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'buyer@test.com', password: 'Pass1234!', name: 'Buyer' })
        .expect(201);
      expect(res.body.user.email).toBe('buyer@test.com');
    });

    it('registers seller user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'seller-1', email: 'seller@test.com', name: 'Seller', role: 'USER' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-2' });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'seller@test.com', password: 'Pass1234!', name: 'Seller' })
        .expect(201);
      expect(res.body.user.email).toBe('seller@test.com');
    });
  });

  describe('2. KYC (Company Verification)', () => {
    it('submits KYC verification', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: COMPANY_1, name: 'Test Co' });
      mockPrisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      mockPrisma.companyVerification.findFirst.mockResolvedValue(null);
      mockPrisma.companyVerification.create.mockResolvedValue({
        id: VER_1, companyId: COMPANY_1, status: 'PENDING', level: 'LEVEL_1',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      const res = await request(app.getHttpServer())
        .post('/api/v1/company-verifications')
        .set('Authorization', auth)
        .send({ companyId: COMPANY_1, level: 'LEVEL_1', documents: [{ documentType: 'BUSINESS_REGISTRATION', documentUrl: 'https://s3.test/doc.pdf' }] })
        .expect(201);
      expect(res.body.status).toBe('PENDING');
    });

    it('approves KYC verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'e2e-user-1', role: 'SUPER_ADMIN' });
      mockPrisma.companyVerification.findUnique.mockResolvedValue({ id: VER_1, status: 'PENDING', level: 'LEVEL_1', companyId: COMPANY_1, company: { id: COMPANY_1, verificationLevel: 'LEVEL_0', slug: 'test-co' }, documents: [] });
      mockPrisma.companyVerification.update.mockResolvedValue({ id: VER_1, status: 'APPROVED', level: 'LEVEL_1' });
      mockPrisma.company.update.mockResolvedValue({ id: COMPANY_1, verificationLevel: 'LEVEL_1' });
      mockPrisma.auditLog.create.mockResolvedValue({});
      const res = await request(app.getHttpServer())
        .post(`/api/v1/company-verifications/${VER_1}/review`)
        .set('Authorization', auth)
        .send({ status: 'APPROVED', notes: 'Verified' })
        .expect(201);
      expect(res.body.status).toBe('APPROVED');
    });
  });

  describe('3. Product Creation', () => {
    it('creates product for seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-1', role: 'SUPER_ADMIN' });
      mockPrisma.company.findFirst.mockResolvedValue({ id: COMPANY_1, slug: 'test-co', trustScore: 80, verificationLevel: 'LEVEL_1' });
      mockPrisma.product.create.mockResolvedValue({
        id: PRODUCT_1, name: 'Widget', slug: 'test-co-widget',
        company: { id: COMPANY_1, name: 'Test Co', slug: 'test-co' },
        category: null, industry: null, media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', auth)
        .send({ companyId: COMPANY_1, name: 'Widget', shortDescription: 'A widget', productType: 'PHYSICAL', status: 'ACTIVE', moq: 10, unit: 'piece' })
        .expect(201);
      expect(res.body.name).toBe('Widget');
    });
  });

  describe('4. RFQ Creation', () => {
    it('creates RFQ as buyer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'buyer-1', role: 'USER', companyOwners: [{ companyId: COMPANY_1 }] });
      mockPrisma.rfqNumberCounter.upsert.mockResolvedValue({ id: 'RF-260614-0001', seq: 1 });
      mockPrisma.rfq.create.mockResolvedValue({
        id: RFQ_1, companyId: COMPANY_1, status: 'DRAFT',
        products: [], quotes: [], documents: [],
      });
      mockPrisma.rfq.update.mockResolvedValue({ id: RFQ_1, rfqNumber: 'TRFQ-MH-260614-0001', stateCode: 'MH' });
      mockPrisma.auditLog.create.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/rfq`)
        .set('Authorization', auth)
        .send({ title: 'Need Widgets', rfqType: 'PRODUCT', targetDate: '2026-07-01T00:00:00Z', deliveryCity: 'Mumbai', deliveryCountry: 'IN', productItems: [{ productName: 'Widget', quantity: 100 }] })
        .expect(201);
      expect(res.body.status).toBe('DRAFT');
    });
  });

  describe('5. TRADMATCH Broadcast', () => {
    it('publishes RFQ to matching sellers', async () => {
      mockPrisma.rfq.findFirst.mockResolvedValue({ id: RFQ_1, companyId: COMPANY_1, status: 'DRAFT', rfqType: 'PRODUCT' });
      mockPrisma.rfq.update.mockResolvedValue({ id: RFQ_1, status: 'PUBLISHED' });
      mockPrisma.product.findMany.mockResolvedValue([{ id: PRODUCT_1, companyId: COMPANY_2 }]);
      mockPrisma.auditLog.create.mockResolvedValue({});
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/rfq/${RFQ_1}/publish`)
        .set('Authorization', auth)
        .expect(201);
      expect(res.body.status).toBe('PUBLISHED');
    });
  });

  describe('6. Quote Submission', () => {
    it('submits quote as seller', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-1', role: 'USER', companyOwners: [{ companyId: COMPANY_2 }] });
      mockPrisma.rfq.findFirst.mockResolvedValue({ id: RFQ_1, companyId: COMPANY_1, status: 'ACTIVE' });
      mockPrisma.rfqVendorMatch.findFirst.mockResolvedValue({ id: 'match-1', rfqId: RFQ_1, companyId: COMPANY_2, status: 'SENT' });
      mockPrisma.quote.findFirst.mockResolvedValue(null);
      mockPrisma.quote.create.mockResolvedValue({
        id: QUOTE_1, rfqId: RFQ_1, companyId: COMPANY_2, status: 'SUBMITTED',
        lineItems: [], totalAmount: 5000, currency: 'INR',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_2}/rfq/${RFQ_1}/quotes`)
        .set('Authorization', auth)
        .send({ lineItems: [{ productName: 'Widget', quantity: 100, unitPrice: 50 }], totalAmount: 5000, currency: 'INR', validityDate: '2026-06-21T00:00:00Z' })
        .expect(201);
      expect(res.body.status).toBe('SUBMITTED');
    });
  });

  describe('7. Quote Acceptance', () => {
    it('accepts quote as buyer', async () => {
      mockPrisma.rfq.findFirst.mockResolvedValue({ id: RFQ_1, companyId: COMPANY_1, status: 'ACTIVE' });
      mockPrisma.quote.findFirst.mockResolvedValue({ id: QUOTE_1, rfqId: RFQ_1, companyId: COMPANY_2, status: 'SUBMITTED', validityDate: new Date(Date.now() + 86400000) });
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.quote.update.mockResolvedValue({ id: QUOTE_1, status: 'ACCEPTED' });
      mockPrisma.rfq.update.mockResolvedValue({ id: RFQ_1, status: 'ORDERED' });
      mockPrisma.company.findUnique.mockResolvedValue({ id: COMPANY_1, name: 'Test Co' });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/rfq/${RFQ_1}/quotes/${QUOTE_1}/accept`)
        .set('Authorization', auth)
        .expect(200);
      expect(res.ok).toBe(true);
    });
  });

  describe('8. Order Creation', () => {
    it('creates order from accepted quote', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'seller-1', role: 'USER' });
      mockPrisma.company.findFirst.mockResolvedValue({ id: COMPANY_1 });
      mockPrisma.order.create.mockResolvedValue({
        id: ORDER_1, buyerCompanyId: COMPANY_1, sellerCompanyId: COMPANY_2, status: 'PENDING',
        totalAmount: 5000, currency: 'INR', lineItems: [], timeline: [], documents: [],
      });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/orders`)
        .set('Authorization', auth)
        .send({ source: 'RFQ', type: 'PRODUCT', sellerCompanyId: COMPANY_2, subtotal: 5000, totalAmount: 5000, quantity: 100, items: [{ productName: 'Widget', quantity: 100, unitPrice: 50 }] })
        .expect(201);
      expect(res.body.status).toBe('PENDING');
    });
  });

  describe('9. Payment', () => {
    it('processes payment for order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: ORDER_1, buyerCompanyId: COMPANY_1, status: 'CONFIRMED', totalAmount: 5000, currency: 'INR' });
      mockPrisma.payment.create.mockResolvedValue({
        id: PAY_1, orderId: ORDER_1, amount: 5000, currency: 'INR', status: 'CAPTURED', gateway: 'razorpay',
      });
      mockPrisma.order.update.mockResolvedValue({ id: ORDER_1, status: 'PAID' });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/payments/order`)
        .set('Authorization', auth)
        .send({ type: 'ORDER_PAYMENT', amount: 5000, orderId: ORDER_1 })
        .expect(201);
      expect(res.body.gatewayOrderId).toBe('rzp_order_123');
    });
  });

  describe('10. Escrow Hold', () => {
    it('holds payment in escrow', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({ id: PAY_1, orderId: ORDER_1, status: 'CAPTURED' });
      mockPrisma.order.findUnique.mockResolvedValue({ id: ORDER_1, buyerCompanyId: COMPANY_1, sellerCompanyId: COMPANY_2 });
      mockPrisma.escrow.create.mockResolvedValue({
        id: ESCROW_1, orderId: ORDER_1, amount: 5000, status: 'HELD',
      });
      mockPrisma.payment.update.mockResolvedValue({ id: PAY_1, status: 'ESCROW_HELD' });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/escrow`)
        .set('Authorization', auth)
        .send({ orderId: ORDER_1 })
        .expect(201);
      expect(res.body.status).toBe('HELD');
    });
  });

  describe('11. Settlement', () => {
    it('releases escrow and settles to seller', async () => {
      mockPrisma.escrow.findUnique.mockResolvedValue({ id: ESCROW_1, orderId: ORDER_1, amount: 5000, netAmount: 4750, status: 'RELEASED' });
      mockPrisma.escrow.update.mockResolvedValue({ id: ESCROW_1, status: 'RELEASED' });
      mockPrisma.settlement.create.mockResolvedValue({
        id: SETT_1, escrowId: ESCROW_1, amount: 4750, status: 'PROCESSED',
      });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/settlements`)
        .set('Authorization', auth)
        .send({ escrowId: ESCROW_1 })
        .expect(201);
      expect(res.body.status).toBe('PROCESSED');
    });
  });

  describe('12. GOCASH Rewards', () => {
    it('awards GoCash for completed trade', async () => {
      mockPrisma.goCashBalance.findUnique.mockResolvedValue({ companyId: COMPANY_1, balance: 100 });
      mockPrisma.goCashBalance.upsert.mockResolvedValue({ companyId: COMPANY_1, balance: 150 });
      mockPrisma.goCashTransaction.create.mockResolvedValue({
        id: GOCASH_1, companyId: COMPANY_1, type: 'EARNED', amount: 50, balanceAfter: 150,
      });
      const res = await request(app.getHttpServer())
        .post(`/api/v1/companies/${COMPANY_1}/go-cash/transactions`)
        .set('Authorization', auth)
        .send({ type: 'EARNED', amount: 50, reason: 'Trade reward' })
        .expect(201);
      expect(res.body.type).toBe('EARNED');
    });
  });

  describe('13. TRADGO Updates', () => {
    it('skips trust score update - no direct endpoint available', () => {
      // Trust scores are updated programmatically via TradTrustService.
      // No dedicated REST endpoint exists for direct trust score updates.
    });
  });
});
