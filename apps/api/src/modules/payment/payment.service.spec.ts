import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { RazorpayService } from './gateways/razorpay.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StripeService } from './gateways/stripe.service';
import { MembershipService } from '../membership/membership.service';
import { EscrowService } from '../escrow/escrow.service';
import { InvoiceService } from '../billing/invoice.service';
import { NotificationService } from '../notification/notification.service';

const mockPrisma = {
  $transaction: jest.fn(),
  company: {
    findFirst: jest.fn(),
  },
  membershipPlan: {
    findUnique: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
  rfqCreditPack: {
    findUnique: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  refund: {
    create: jest.fn(),
    aggregate: jest.fn(),
    updateMany: jest.fn(),
  },
  rfqCreditLedger: {
    create: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  invoiceSequence: {
    upsert: jest.fn().mockResolvedValue({ lastSeq: 1 }),
  },
  auditLog: {
    create: jest.fn(),
  },
};

const mockRazorpayService = {
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
  createRefund: jest.fn(),
  getKeyId: jest.fn().mockReturnValue('rzp_test_key'),
};

const mockStripeService = {
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
};

const mockMembershipService = {
  activateSubscription: jest.fn(),
};

const mockEscrowService = {
  hold: jest.fn(),
};

const mockInvoiceService = {
  generateInvoiceNumber: jest.fn().mockResolvedValue('TRD/26-27/000001'),
};

const mockNotificationService = {
  createWithTemplate: jest.fn().mockResolvedValue(undefined),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('PaymentService', () => {
  let service: PaymentService;
  let razorpay: RazorpayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpayService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: MembershipService, useValue: mockMembershipService },
        { provide: EscrowService, useValue: mockEscrowService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    razorpay = module.get<RazorpayService>(RazorpayService);
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    jest.clearAllMocks();
  });

  describe('createPaymentOrder', () => {
    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);
      await expect(
        service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT' as any, amount: 10000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if orderId missing for ORDER_PAYMENT', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      await expect(
        service.createPaymentOrder('company-1', { type: 'ORDER_PAYMENT' as any, amount: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a Razorpay order from the persisted order total (client amount ignored)', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        buyerCompanyId: 'company-1',
        totalAmount: new Prisma.Decimal('500.00'),
        currency: 'INR',
        deletedAt: null,
      });
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      mockRazorpayService.createOrder.mockResolvedValue({
        id: 'order_OeP9K7ZcNxLm1',
        amount: 50000,
        currency: 'INR',
      });
      mockPrisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await service.createPaymentOrder('company-1', {
        type: 'ORDER_PAYMENT' as any,
        amount: 100,
        orderId: 'order-1',
      });

      expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(50000, 'INR', expect.any(String), {
        companyId: 'company-1',
        type: 'ORDER_PAYMENT',
      });
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ amount: 50000, orderId: 'order-1' }) }),
      );
      expect(result.id).toBe('payment-1');
      expect(result.gatewayOrderId).toBe('order_OeP9K7ZcNxLm1');
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.verifyPayment('company-1', {
          razorpayOrderId: 'order_OeP9K7ZcNxLm1',
          razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
          razorpaySignature: 'sig',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if signature invalid', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', status: 'PENDING' });
      mockRazorpayService.verifyPayment.mockReturnValue(false);
      await expect(
        service.verifyPayment('company-1', {
          razorpayOrderId: 'order_OeP9K7ZcNxLm1',
          razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
          razorpaySignature: 'bad-sig',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update payment to CAPTURED on valid signature', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        companyId: 'company-1',
        gatewayOrderId: 'order_OeP9K7ZcNxLm1',
        status: 'PENDING',
      });
      mockRazorpayService.verifyPayment.mockReturnValue(true);
      mockPrisma.payment.update.mockResolvedValue({
        id: 'payment-1',
        status: 'CAPTURED',
        gatewayPaymentId: 'pay_OeP9K7ZcNxLm2',
      });
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockResolvedValue({});

      const result = await service.verifyPayment('company-1', {
        razorpayOrderId: 'order_OeP9K7ZcNxLm1',
        razorpayPaymentId: 'pay_OeP9K7ZcNxLm2',
        razorpaySignature: 'valid-sig',
      });

      expect(mockRazorpayService.verifyPayment).toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({ status: 'CAPTURED' }),
        }),
      );
      expect(result.status).toBe('CAPTURED');
    });
  });

  describe('findAll', () => {
    it('should return paginated payments', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: 'payment-1', refunds: [], order: null }]);
      mockPrisma.payment.count.mockResolvedValue(1);
      const result = await service.findAll('company-1');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(service.findOne('company-1', 'payment-1')).rejects.toThrow(NotFoundException);
    });

    it('should return payment with refunds', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        refunds: [],
        order: null,
        rfqCreditPack: null,
      });
      const result = await service.findOne('company-1', 'payment-1');
      expect(result.id).toBe('payment-1');
    });
  });

  describe('createRefund', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.createRefund('company-1', 'payment-1', { amount: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment not captured', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', status: 'PENDING', amount: 5000, companyId: 'company-1' });
      await expect(
        service.createRefund('company-1', 'payment-1', { amount: 1000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create refund and update payment status', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        status: 'CAPTURED',
        amount: 5000,
        companyId: 'company-1',
        gatewayPaymentId: 'pay_OeP9K7ZcNxLm2',
      });
      mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      mockRazorpayService.createRefund.mockResolvedValue({ id: 'rfnd_OeP9K7ZcNxLm3' });
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1', status: 'PROCESSING' });
      mockPrisma.payment.update.mockResolvedValue({});

      const result = await service.createRefund('company-1', 'payment-1', {
        amount: 5000,
        reason: 'Customer returned item',
      });

      expect(mockRazorpayService.createRefund).toHaveBeenCalled();
      expect(mockPrisma.refund.create).toHaveBeenCalled();
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { status: 'REFUNDED' } }),
      );
      expect(result.status).toBe('PROCESSING');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should capture payment on payment.captured event', async () => {
      mockPrisma.payment.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'payment-1', type: 'ORDER_PAYMENT', status: 'PENDING', companyId: 'company-1', amount: 5000, currency: 'INR' });
      mockPrisma.payment.update.mockResolvedValue({});
      mockPrisma.invoice.findUnique.mockResolvedValue(null);
      mockInvoiceService.generateInvoiceNumber.mockResolvedValue('TRD/26-27/000001');
      mockPrisma.invoice.create.mockResolvedValue({});

      await service.handleWebhookEvent('payment.captured', {
        payment: { entity: { id: 'pay_123', order_id: 'order_123' } },
      });

      expect(mockPrisma.payment.update).toHaveBeenCalled();
    });
  });
});

describe('createSubscriptionGatewayOrder - P0-5 money unit contract (rupees -> paise, exactly one conversion)', () => {
  let service: PaymentService;

  const plan = {
    id: 'plan-1',
    planId: 'trade_smart',
    name: 'Trade Smart',
    pricePlanA: 12000,
    pricePlanB: 18000,
    pricePlanC: 30000,
  };

  const baseDto = { planId: 'trade_smart', planTier: 'A' as const, duration: 1, gateway: 'RAZORPAY' };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpayService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: MembershipService, useValue: mockMembershipService },
        { provide: EscrowService, useValue: mockEscrowService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);

    mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockPrisma.payment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pay-1', ...data }));
    mockRazorpayService.createOrder.mockImplementation(({ amount }: any) =>
      Promise.resolve({ id: 'order_test_1', gatewayOrderId: 'order_test_1', amount, currency: 'INR' }),
    );
  });

  it.each([
    ['â‚¹1 plan', { pricePlanA: 1, pricePlanB: 1, pricePlanC: 1 }, 'A', 1, 100],
    ['â‚¹100 plan', { pricePlanA: 100, pricePlanB: 100, pricePlanC: 100 }, 'A', 1, 10000],
    ['â‚¹12,000 plan (no 100x undercharge)', { pricePlanA: 12000, pricePlanB: 18000, pricePlanC: 30000 }, 'A', 1, 1200000],
    ['tier B (â‚¹18,000)', { pricePlanA: 12000, pricePlanB: 18000, pricePlanC: 30000 }, 'B', 1, 1800000],
    ['tier C x3 duration (â‚¹30,000 x 3)', { pricePlanA: 12000, pricePlanB: 18000, pricePlanC: 30000 }, 'C', 3, 9000000],
  ])('%s -> Razorpay receives %d paise', async (_label, prices, tier, duration, expectedPaise) => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ ...plan, ...prices });
    const result = await service.createSubscriptionGatewayOrder('company-1', 'user-1', { ...baseDto, planTier: tier as any, duration } as any, 'RAZORPAY');
    expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(expectedPaise, 'INR', expect.any(String), expect.objectContaining({ planId: 'trade_smart' }));
    expect(result.amount).toBe(expectedPaise);
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amount: expectedPaise, currency: 'INR' }),
    }));
  });

  it('stores the canonical paise amount in Payment.amount (matches booking convention)', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ ...plan });
    await service.createSubscriptionGatewayOrder('company-1', 'user-1', baseDto as any, 'RAZORPAY');
    const stored = mockPrisma.payment.create.mock.calls[0][0].data;
    expect(stored.amount).toBe(1200000); // â‚¹12,000 in paise
  });

  it('performs EXACTLY ONE x100 conversion (no overcharge/double-conversion)', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ ...plan });
    await service.createSubscriptionGatewayOrder('company-1', 'user-1', baseDto as any, 'RAZORPAY');
    // gateway.createOrder(amountInPaise, 'INR', receipt, notes) â€” first positional arg is the paise amount
    const gatewayAmount = mockRazorpayService.createOrder.mock.calls[0][0];
    expect(gatewayAmount).toBe(1200000); // 12000 * 100, NOT 12000 * 100 * 100
  });

  it('reuses an existing PENDING subscription payment without creating a new gateway order', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: 'pay-existing',
      gatewayOrderId: 'order_existing',
      amount: 1200000,
      currency: 'INR',
    });
    const result = await service.createSubscriptionGatewayOrder('company-1', 'user-1', baseDto as any, 'RAZORPAY');
    expect(result.id).toBe('pay-existing');
    expect(mockRazorpayService.createOrder).not.toHaveBeenCalled();
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('â‚¹0 / free plan produces a â‚¹0 paise amount (not accidentally paid)', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({ ...plan, pricePlanA: 0, pricePlanB: 0, pricePlanC: 0 });
    const result = await service.createSubscriptionGatewayOrder('company-1', 'user-1', baseDto as any, 'RAZORPAY');
    expect(result.amount).toBe(0);
    expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(0, 'INR', expect.any(String), expect.anything());
  });
});

describe('verifySubscriptionPayment - P0-2 atomicity (capture + activation in ONE transaction)', () => {
  let service: PaymentService;
  const pendingPayment = {
    id: 'pay-1',
    companyId: 'company-1',
    type: 'SUBSCRIPTION',
    status: 'PENDING',
    amount: 1200000,
    currency: 'INR',
    gatewayOrderId: 'order_test_123',
    notes: { planId: 'trade-smart-launch', planTier: 'A', duration: 1 },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpayService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: MembershipService, useValue: mockMembershipService },
        { provide: EscrowService, useValue: mockEscrowService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
    mockRazorpayService.verifyPayment.mockReturnValue(true);
  });

  it('captures + activates inside ONE transaction for a LAUNCH plan (trade-smart-launch now succeeds)', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({ ...pendingPayment });
    mockPrisma.payment.update.mockResolvedValue({ ...pendingPayment, status: 'CAPTURED' });

    const result = await service.verifySubscriptionPayment('company-1', {
      paymentId: 'pay-1', gatewayPaymentId: 'pay_test_1', gatewaySignature: 'valid', gateway: 'RAZORPAY',
    } as any, 'RAZORPAY');

    expect(result.success).toBe(true);
    expect(result.planId).toBe('trade-smart-launch');
    expect(mockMembershipService.activateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ planId: 'trade-smart-launch', paymentId: 'pay-1' }),
      expect.anything(),
    );
  });

  it('activation failure propagates â€” a real Postgres tx rolls back the capture (payment stays PENDING/retryable)', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({ ...pendingPayment });
    mockMembershipService.activateSubscription.mockRejectedValue(new BadRequestException("Plan 'x' not supported"));
    mockPrisma.payment.update.mockResolvedValue({});

    await expect(
      service.verifySubscriptionPayment('company-1', {
        paymentId: 'pay-1', gatewayPaymentId: 'pay_test_1', gatewaySignature: 'valid', gateway: 'RAZORPAY',
      } as any, 'RAZORPAY'),
    ).rejects.toThrow();

    expect(mockPrisma.payment.update).toHaveBeenCalled();
    expect(mockMembershipService.activateSubscription).toHaveBeenCalled();
  });

  it('duplicate verification is idempotent: CAPTURED payment no longer matches PENDING lookup -> NotFound', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    await expect(
      service.verifySubscriptionPayment('company-1', {
        paymentId: 'pay-1', gatewayPaymentId: 'pay_test_1', gatewaySignature: 'valid', gateway: 'RAZORPAY',
      } as any, 'RAZORPAY'),
    ).rejects.toThrow();
    expect(mockMembershipService.activateSubscription).not.toHaveBeenCalled();
  });

  it('invalid signature -> no capture, no activation', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({ ...pendingPayment });
    mockRazorpayService.verifyPayment.mockReturnValue(false);
    await expect(
      service.verifySubscriptionPayment('company-1', {
        paymentId: 'pay-1', gatewayPaymentId: 'pay_test_1', gatewaySignature: 'bad', gateway: 'RAZORPAY',
      } as any, 'RAZORPAY'),
    ).rejects.toThrow();
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    expect(mockMembershipService.activateSubscription).not.toHaveBeenCalled();
  });
});

describe('createSubscriptionGatewayOrder - P0-2 free-plan guard (never a gateway order for 0-amount)', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RazorpayService, useValue: mockRazorpayService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: MembershipService, useValue: mockMembershipService },
        { provide: EscrowService, useValue: mockEscrowService },
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
  });

  it('rejects a FREE plan (trad-up) with a clear error â€” use activate-free instead', async () => {
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1', planId: 'trad-up', name: 'TRAD UP',
      pricePlanA: 0, pricePlanB: 0, pricePlanC: 0, isFree: true,
    });
    await expect(
      service.createSubscriptionGatewayOrder('company-1', 'user-1', { planId: 'trad-up', planTier: 'A', duration: 1, gateway: 'RAZORPAY' } as any, 'RAZORPAY'),
    ).rejects.toThrow('Free plans are activated directly');
    expect(mockRazorpayService.createOrder).not.toHaveBeenCalled();
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('Wave-2 paid-plan conversion intact after P0-2 changes (12,000 rupees -> 1,200,000 paise)', async () => {
    mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockPrisma.payment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pay-1', ...data }));
    mockRazorpayService.createOrder.mockImplementation((amount: number) =>
      Promise.resolve({ id: 'order_1', gatewayOrderId: 'order_1', amount, currency: 'INR' }));
    mockPrisma.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1', planId: 'trade_smart', name: 'Trade Smart',
      pricePlanA: 12000, pricePlanB: 18000, pricePlanC: 30000, isFree: false,
    });
    const result = await service.createSubscriptionGatewayOrder('company-1', 'user-1', { planId: 'trade_smart', planTier: 'A', duration: 1, gateway: 'RAZORPAY' } as any, 'RAZORPAY');
    expect(result.amount).toBe(1200000);
    expect(mockRazorpayService.createOrder.mock.calls[0][0]).toBe(1200000);
  });
});
