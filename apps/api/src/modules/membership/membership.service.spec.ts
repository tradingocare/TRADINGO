import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma, createMockTx } from '../../common/test/test-utils';
import { InvoiceService } from '../billing/invoice.service';
import { TaxService } from '../billing/tax.service';
import { RazorpayService } from '../payment/gateways/razorpay.service';

describe('MembershipService', () => {
  let service: MembershipService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let razorpayServiceMock: { verifyPayment: jest.Mock };
  const txMock = createMockTx();

  const mockPlan = {
    id: 'plan-1',
    planId: 'trade_smart',
    name: 'Trade Smart',
    description: 'Smart plan',
    pricePlanA: 12000,
    pricePlanB: 18000,
    pricePlanC: 24000,
    duration: 12,
    sortOrder: 2,
    visibility: 'PUBLIC',
    isActive: true,
    isFree: false,
    badgeText: null,
    features: ['RFQ', 'Direct Orders'],
    gracePeriodDays: 7,
    trialPeriodDays: 14,
    upgradeRules: null,
    downgradeRules: null,
    renewalRules: null,
    metadata: null,
    scheduledVisibility: null,
    autoPublishAt: null,
    autoHideAt: null,
    launchOfferEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    planFeatures: [],
    planAddons: [],
  };

  const mockCompany = {
    id: 'company-1',
    name: 'Test Corp',
    email: 'test@test.com',
    slug: 'test-corp',
    subscriptionStatus: 'ACTIVE',
    subscriptionPlan: 'trade_smart',
    currentPlanId: 'trade_smart',
    subscriptionActivatedAt: new Date('2026-01-01'),
    subscriptionExpiresAt: new Date('2026-07-01'),
    subscriptionGraceStart: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    razorpayServiceMock = { verifyPayment: jest.fn() };
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoiceService, useValue: { createSubscriptionInvoice: jest.fn().mockResolvedValue({ invoiceNumber: 'INV-001' }) } },
        { provide: TaxService, useValue: { calculateTax: jest.fn().mockResolvedValue({ gst: 1800, total: 13800 }) } },
        { provide: RazorpayService, useValue: razorpayServiceMock },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
  });

  describe('getPlans', () => {
    it('should return active plans', async () => {
      prisma.membershipPlan.findMany.mockResolvedValue([mockPlan]);
      const result = await service.getPlans();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by visibility', async () => {
      prisma.membershipPlan.findMany.mockResolvedValue([mockPlan]);
      const result = await service.getPlans('PUBLIC');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPlanBySlug', () => {
    it('should return plan by planId', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue(mockPlan);
      const result = await service.getPlanBySlug('trade_smart');
      expect(result).toBeDefined();
      expect(result.planId).toBe('trade_smart');
    });

    it('should throw on missing plan', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue(null);
      await expect(service.getPlanBySlug('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return company subscription', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      const result = await service.getCurrentSubscription('company-1');
      expect(result).toBeDefined();
      expect(result.subscriptionStatus).toBe('ACTIVE');
    });

    it('should throw on missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.getCurrentSubscription('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubscriptionDetail', () => {
    it('should return detailed subscription info', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.subscriptionEvent.findMany.mockResolvedValue([]);
      const result = await service.getSubscriptionDetail('company-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('company-1');
    });

    it('should throw on missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.getSubscriptionDetail('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmPayment (P0-8 remediation)', () => {
    const mockPayment = {
      id: 'pay-1',
      companyId: 'company-1',
      status: 'PENDING',
      amount: 12000,
      currency: 'INR',
      gatewayOrderId: 'order_test_123',
      gatewayPaymentId: null,
      notes: { orderId: 'ORD-1', planId: 'trade_smart', planTier: 'A' },
    };

    it('confirms own PENDING payment with valid signature transactionally', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment });
      razorpayServiceMock.verifyPayment.mockReturnValue(true);
      txMock.payment.update.mockResolvedValue({ ...mockPayment, status: 'CAPTURED', gatewayPaymentId: 'pay_test_abc' });
      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));

      const result = await service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'valid_sig');
      expect(result.success).toBe(true);
      expect(razorpayServiceMock.verifyPayment).toHaveBeenCalledWith({
        gatewayOrderId: 'order_test_123',
        gatewayPaymentId: 'pay_test_abc',
        gatewaySignature: 'valid_sig',
      });
      expect(txMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'pay-1' }, data: expect.objectContaining({ status: 'CAPTURED', gatewayPaymentId: 'pay_test_abc' }) }),
      );
      expect(txMock.company.update).toHaveBeenCalled();
      expect(txMock.subscriptionEvent.create).toHaveBeenCalled();
      expect(txMock.planHistory.create).toHaveBeenCalled();
      expect(txMock.invoice.create).toHaveBeenCalled();
    });

    it('rejects another tenant\'s paymentId (ownership scoping -> 404)', async () => {
      // findFirst is scoped { id, companyId } so a cross-tenant paymentId resolves to null
      prisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.confirmPayment('company-A', 'pay-of-company-B', 'pay_test_abc', 'valid_sig'),
      ).rejects.toThrow(NotFoundException);
      expect(razorpayServiceMock.verifyPayment).not.toHaveBeenCalled();
    });

    it('rejects invalid Razorpay signature', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment });
      razorpayServiceMock.verifyPayment.mockReturnValue(false);
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'forged_sig'),
      ).rejects.toThrow(BadRequestException);
      expect(txMock.payment.update).not.toHaveBeenCalled();
    });

    it('rejects missing signature', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment });
      razorpayServiceMock.verifyPayment.mockReturnValue(false);
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects payment with no gateway order reference', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, gatewayOrderId: null });
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'sig'),
      ).rejects.toThrow(BadRequestException);
      expect(razorpayServiceMock.verifyPayment).not.toHaveBeenCalled();
    });

    it('rejects terminal FAILED payment (cannot resurrect as success)', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, status: 'FAILED' });
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'sig'),
      ).rejects.toThrow(BadRequestException);
      expect(txMock.payment.update).not.toHaveBeenCalled();
    });

    it('rejects REFUNDED payment', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, status: 'REFUNDED' });
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles already-CAPTURED payment idempotently (no duplicate activation)', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, status: 'CAPTURED', gatewayPaymentId: 'pay_test_abc' });
      razorpayServiceMock.verifyPayment.mockReturnValue(true); // authenticity still proven first
      prisma.invoice.findUnique.mockResolvedValue({ invoiceNumber: 'INV-202609-ABC123' });
      const result: any = await service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'sig');
      expect(result.idempotent).toBe(true);
      expect(result.invoiceNumber).toBe('INV-202609-ABC123');
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(txMock.payment.update).not.toHaveBeenCalled();
      expect(txMock.subscriptionEvent.create).not.toHaveBeenCalled();
      expect(txMock.invoice.create).not.toHaveBeenCalled();
    });

    it('rejects already-CAPTURED payment with a DIFFERENT gateway payment id', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment, status: 'CAPTURED', gatewayPaymentId: 'pay_original' });
      razorpayServiceMock.verifyPayment.mockReturnValue(true); // forged signature for a different payment
      await expect(
        service.confirmPayment('company-1', 'pay-1', 'pay_other', 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not trust client-supplied amounts — activation uses stored payment data', async () => {
      prisma.payment.findFirst.mockResolvedValue({ ...mockPayment });
      razorpayServiceMock.verifyPayment.mockReturnValue(true);
      txMock.payment.update.mockResolvedValue({ ...mockPayment, status: 'CAPTURED', gatewayPaymentId: 'pay_test_abc' });
      prisma.$transaction.mockImplementation(async (fn: any) => fn(txMock));
      await service.confirmPayment('company-1', 'pay-1', 'pay_test_abc', 'sig');
      // company.update is driven by stored notes (planId from DB row), and no amount
      // parameter is accepted by the API at all
      const companyCall = txMock.company.update.mock.calls[0][0];
      expect(companyCall.data.currentPlanId).toBe('trade_smart');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, subscriptionStatus: 'CANCELLED' });
      const result = await service.cancelSubscription('company-1', 'No longer needed');
      expect(result.success).toBe(true);
    });

    it('should throw on missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.cancelSubscription('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('enrollTrial', () => {
    it('should enroll company in trial', async () => {
      prisma.company.findUnique.mockResolvedValue({ ...mockCompany, subscriptionStatus: 'TRIAL' });
      prisma.membershipPlan.findUnique.mockResolvedValue(mockPlan);
      const result = await service.enrollTrial('company-1', 'trade_smart');
      expect(result.success).toBe(true);
      expect(result.status).toBe('TRIAL');
    });

    it('should throw on missing company', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      await expect(service.enrollTrial('bad', 'plan-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateSubscription', () => {
    it('should activate subscription', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      prisma.company.update.mockResolvedValue(mockCompany);
      const dto = { companyId: 'company-1', planId: 'trade_smart', planTier: 'A', amount: 12000, paymentId: 'pay-1' };
      const result = await service.activateSubscription(dto);
      expect(result.success).toBe(true);
    });

    // ── P0-2 Wave 3: plan-type resolution + tx threading + launch-plan support ──

    it('activates a LAUNCH plan (trade-smart-launch) with nullable subscriptionPlan + identity via currentPlanId', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue({ state: 'Delhi' });
      prisma.company.findUnique.mockResolvedValue({ gstNumber: null });
      const dto = { companyId: 'company-1', planId: 'trade-smart-launch', planTier: 'A', amount: 1200000, paymentId: 'pay-1' };
      const result = await service.activateSubscription(dto);
      expect(result.success).toBe(true);
      const companyUpdate = prisma.company.update.mock.calls[0][0];
      expect(companyUpdate.data.currentPlanId).toBe('trade-smart-launch');
      // nullable enum — launch plans are not PlanType members (no schema change in this wave)
      expect(companyUpdate.data.subscriptionPlan).toBeNull();
      const eventCreate = prisma.subscriptionEvent.create.mock.calls[0][0];
      expect(eventCreate.data.planType).toBeNull();
      expect(eventCreate.data.metadata.planId).toBe('trade-smart-launch');
    });

    it('still maps core plans to their PlanType enum value', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue({ state: 'Delhi' });
      prisma.company.findUnique.mockResolvedValue({ gstNumber: null });
      const dto = { companyId: 'company-1', planId: 'trade_pro', planTier: 'A', amount: 2400000, paymentId: 'pay-1' };
      await service.activateSubscription(dto);
      const companyUpdate = prisma.company.update.mock.calls[0][0];
      expect(companyUpdate.data.subscriptionPlan).toBe('TRADE_PRO');
    });

    it('throws for an UNKNOWN plan BEFORE any write (cannot strand a payment)', async () => {
      const dto = { companyId: 'company-1', planId: 'does-not-exist', planTier: 'A', amount: 1, paymentId: 'pay-1' };
      await expect(service.activateSubscription(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(prisma.subscriptionEvent.create).not.toHaveBeenCalled();
    });

    it('accepts a transaction client and routes all writes through it (atomicity)', async () => {
      const tx = createMockTx() as any;
      prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));
      prisma.companyLocation.findFirst.mockResolvedValue({ state: 'Delhi' });
      const dto = { companyId: 'company-1', planId: 'trade_smart', planTier: 'A', amount: 1200000, paymentId: 'pay-1' };
      await service.activateSubscription(dto, tx);
      expect(tx.company.update).toHaveBeenCalled();
      expect(tx.subscriptionEvent.create).toHaveBeenCalled();
      expect(tx.planHistory.create).toHaveBeenCalled();
      expect(prisma.company.update).not.toHaveBeenCalled(); // never bypassed the tx
    });
  });

  describe('activateFreePlan — P0-2 TRAD UP free activation (no gateway)', () => {
    const freePlan = {
      id: 'plan-tradup',
      planId: 'trad-up',
      name: 'TRAD UP™',
      pricePlanA: 0, pricePlanB: 0, pricePlanC: 0,
      duration: 6,
      isActive: true,
      isFree: true,
      visibility: 'LAUNCH',
      trialPeriodDays: 0,
    };

    it('activates TRAD UP directly (no Razorpay involvement) with the 90-day default term', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...freePlan });
      prisma.appSetting.findUnique.mockResolvedValue({ value: true }); // launch mode ON
      prisma.company.findUnique.mockResolvedValue({ ...mockCompany, panNumber: null, currentPlanId: null, subscriptionStatus: 'TRIAL' });
      prisma.company.findMany.mockResolvedValue([]);
      prisma.planHistory.findMany.mockResolvedValue([]);
      const tx = createMockTx();
      tx.company.findMany.mockResolvedValue([]);
      tx.planHistory.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));

      const result: any = await service.activateFreePlan('company-1', 'trad-up');
      expect(result.success).toBe(true);
      expect(result.idempotent).toBeUndefined();
      expect(result.durationDays).toBe(90);
      const companyUpdate = tx.company.update.mock.calls[0][0];
      expect(companyUpdate.data.currentPlanId).toBe('trad-up');
      expect(companyUpdate.data.subscriptionPlan).toBeNull(); // not an enum member
      // 90-day term: expiry lands ~90 days out (not the legacy 6-month math)
      const expires: Date = companyUpdate.data.subscriptionExpiresAt;
      const daysOut = Math.round((expires.getTime() - Date.now()) / 86400000);
      expect(daysOut).toBeGreaterThanOrEqual(89);
      expect(daysOut).toBeLessThanOrEqual(90);
      const history = tx.planHistory.create.mock.calls[0][0];
      expect(history.data.metadata.freeActivation).toBe(true);
      expect(history.data.metadata.durationDays).toBe(90);
    });

    it('is idempotent when the company is ALREADY active on the same free plan', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...freePlan });
      prisma.appSetting.findUnique.mockResolvedValue({ value: true });
      prisma.company.findUnique.mockResolvedValue({
        ...mockCompany,
        currentPlanId: 'trad-up',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(Date.now() + 90 * 86400 * 1000),
      });
      const result: any = await service.activateFreePlan('company-1', 'trad-up');
      expect(result.idempotent).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('is BLOCKED when launch mode is OFF (admin control preserved)', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...freePlan });
      prisma.appSetting.findUnique.mockResolvedValue({ value: false }); // admin closed the launch
      await expect(service.activateFreePlan('company-1', 'trad-up')).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a PAID plan (must use the purchase flow, never a fake order)', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...freePlan, planId: 'trade_smart', isFree: false });
      await expect(service.activateFreePlan('company-1', 'trade_smart')).rejects.toThrow(BadRequestException);
    });

    it('rejects an inactive plan', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...freePlan, isActive: false });
      await expect(service.activateFreePlan('company-1', 'trad-up')).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown plan id', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue(null);
      await expect(service.activateFreePlan('company-1', 'nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('TRAD UP final business policy — 90-day term, admin control, one-PAN lifetime', () => {
    const tradUpPlan = {
      id: 'plan-tradup',
      planId: 'trad-up',
      name: 'TRAD UP™',
      pricePlanA: 0, pricePlanB: 0, pricePlanC: 0,
      duration: 3,
      isActive: true,
      isFree: true,
      visibility: 'LAUNCH',
      trialPeriodDays: 0,
      metadata: null as any,
    };
    const panCompany = {
      ...mockCompany,
      id: 'company-1',
      panNumber: 'ABCDE1234F',
      currentPlanId: null,
      subscriptionStatus: 'TRIAL',
      subscriptionExpiresAt: null,
    };

    function mockCleanSlate(tx: any) {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.planHistory.findMany.mockResolvedValue([]);
      tx.company.findMany.mockResolvedValue([]);
      tx.planHistory.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));
    }

    function mockLaunchOn() {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...tradUpPlan });
      prisma.appSetting.findUnique.mockResolvedValue({ value: true });
      prisma.membershipPlanVersion.findFirst.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ ...panCompany });
    }

    // B. Admin-configured duration applies to NEW activations only.
    it('honors metadata.durationDays override for new activations (admin control)', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...tradUpPlan, metadata: { durationDays: 180 } });
      prisma.appSetting.findUnique.mockResolvedValue({ value: true });
      prisma.membershipPlanVersion.findFirst.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ ...panCompany });
      const tx = createMockTx();
      mockCleanSlate(tx);

      const result: any = await service.activateFreePlan('company-1', 'trad-up');
      expect(result.success).toBe(true);
      expect(result.durationDays).toBe(180);
      const expires: Date = tx.company.update.mock.calls[0][0].data.subscriptionExpiresAt;
      const daysOut = Math.round((expires.getTime() - Date.now()) / 86400000);
      expect(daysOut).toBeGreaterThanOrEqual(179);
      expect(daysOut).toBeLessThanOrEqual(180);
      expect(tx.planHistory.create.mock.calls[0][0].data.metadata.durationSource).toBe('plan-metadata');
    });

    // C. Existing activation terms are snapshotted (admin change is not retroactive).
    it('snapshots durationDays+expiresAt into history so admin changes cannot rewrite it', async () => {
      mockLaunchOn();
      const tx = createMockTx();
      mockCleanSlate(tx);

      await service.activateFreePlan('company-1', 'trad-up');
      const historyMeta = tx.planHistory.create.mock.calls[0][0].data.metadata;
      expect(historyMeta.durationDays).toBe(90);
      expect(historyMeta.durationSource).toBe('trad-up-default');
      expect(typeof historyMeta.expiresAt).toBe('string');
      const eventMeta = tx.subscriptionEvent.create.mock.calls[0][0].data.metadata;
      expect(eventMeta.durationDays).toBe(90);
      expect(eventMeta.expiresAt).toBe(historyMeta.expiresAt);
    });

    // F. One PAN cannot receive TRAD UP twice — sibling company, same PAN.
    it('rejects a second TRAD UP for a sibling company sharing the PAN', async () => {
      mockLaunchOn();
      prisma.company.findMany.mockResolvedValue([{ id: 'company-sibling' }]);
      prisma.planHistory.findMany.mockResolvedValue([{ id: 'hist-1' }]);
      const tx = createMockTx();
      prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));

      await expect(service.activateFreePlan('company-1', 'trad-up')).rejects.toThrow(
        'TRAD UP free benefit has already been consumed for this PAN',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // F/G. Expired previous benefit still blocks; changed email/phone is irrelevant (PAN-anchored).
    it('rejects re-activation after expiry when history exists (same company, new email)', async () => {
      mockLaunchOn();
      prisma.company.findUnique.mockResolvedValue({
        ...panCompany,
        email: 'brand-new-email@example.com',
        mobile: '9999999999',
        currentPlanId: 'trad-up',
        subscriptionStatus: 'EXPIRED',
        subscriptionExpiresAt: new Date(Date.now() - 86400000),
      });
      prisma.company.findMany.mockResolvedValue([{ id: 'company-1' }]);
      prisma.planHistory.findMany.mockResolvedValue([{ id: 'hist-expired' }]);
      const tx = createMockTx();
      prisma.$transaction.mockImplementation(async (fn: any) => fn(tx));

      await expect(service.activateFreePlan('company-1', 'trad-up')).rejects.toThrow(
        'TRAD UP free benefit has already been consumed for this PAN',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // G (no-PAN nuance): companies without a PAN anchor still activate (per-company idempotency applies).
    it('allows activation when the company has no PAN anchor (documented nuance)', async () => {
      mockLaunchOn();
      prisma.company.findUnique.mockResolvedValue({ ...panCompany, panNumber: null });
      const tx = createMockTx();
      mockCleanSlate(tx);

      const result: any = await service.activateFreePlan('company-1', 'trad-up');
      expect(result.success).toBe(true);
      expect(prisma.company.findMany).not.toHaveBeenCalled();
    });

    // D/E. Unavailable when disabled (isActive false) and launch gate enforced.
    it('rejects when the plan is deactivated (admin disable path)', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ ...tradUpPlan, isActive: false });
      await expect(service.activateFreePlan('company-1', 'trad-up')).rejects.toThrow('Plan is not available');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // N. TRAD UP never invokes the payment gateway (no order/invoice path).
    it('writes no payment or invoice rows on free activation', async () => {
      mockLaunchOn();
      const tx = createMockTx();
      mockCleanSlate(tx);

      await service.activateFreePlan('company-1', 'trad-up');
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(tx.invoice.create).not.toHaveBeenCalled();
    });

    // O. No duplicate identity is created by activation (company row updated in place).
    it('updates the company in place without creating a company or user', async () => {
      mockLaunchOn();
      const tx = createMockTx();
      mockCleanSlate(tx);

      await service.activateFreePlan('company-1', 'trad-up');
      expect(tx.company.update).toHaveBeenCalledTimes(1);
      expect(prisma.company.create).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    // K (paid regression guard): commercial activation math is untouched by the TRAD UP days rule.
    it('keeps non-free-plan months semantics out of the TRAD UP days path', async () => {
      const paidLike = { ...tradUpPlan, planId: 'trade-smart-launch', isFree: true, duration: 12, metadata: null };
      prisma.membershipPlan.findUnique.mockResolvedValue(paidLike);
      prisma.appSetting.findUnique.mockResolvedValue({ value: true });
      prisma.membershipPlanVersion.findFirst.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ ...panCompany });
      const tx = createMockTx();
      mockCleanSlate(tx);

      const result: any = await service.activateFreePlan('company-1', 'trade-smart-launch');
      expect(result.success).toBe(true);
      expect(result.durationDays).toBeUndefined();
      const expires: Date = tx.company.update.mock.calls[0][0].data.subscriptionExpiresAt;
      const monthsOut =
        (expires.getFullYear() - new Date().getFullYear()) * 12 + (expires.getMonth() - new Date().getMonth());
      expect(monthsOut).toBeGreaterThanOrEqual(11);
      expect(monthsOut).toBeLessThanOrEqual(12);
    });
  });

  describe('adminGetAllSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      prisma.company.findMany.mockResolvedValue([mockCompany]);
      prisma.company.count.mockResolvedValue(1);
      const result = await service.adminGetAllSubscriptions();
      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('adminGetSubscriptionSummary', () => {
    it('should return subscription summary stats', async () => {
      prisma.company.count.mockResolvedValue(10);
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
      const result = await service.adminGetSubscriptionSummary();
      expect(result.total).toBe(10);
      expect(result.totalSubscriptionRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateCoupon', () => {
    it('should throw on missing coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.validateCoupon('BAD', 'plan-1', 'company-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('processExpiredSubscriptions', () => {
    it('should process expired subscriptions', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      const result = await service.processExpiredSubscriptions();
      expect(result.expired).toBe(0);
    });
  });

  describe('getActivePlanVersion (canonical registration server resolution)', () => {
    it('should return the latest PUBLIC version in its effective window', async () => {
      const v2 = { id: 'v2', planId: 'trade_plus', version: 2, status: 'PUBLIC' };
      prisma.membershipPlanVersion.findFirst.mockResolvedValue(v2);

      const result = await service.getActivePlanVersion('trade_plus');

      expect(result).toEqual(v2);
      const where = prisma.membershipPlanVersion.findFirst.mock.calls[0][0].where;
      expect(where.planId).toBe('trade_plus');
      expect(String(where.status)).toContain('PUBLIC');
    });

    it('should fall back to LAUNCH when no PUBLIC version is acquirable', async () => {
      const launch = { id: 'vl', planId: 'trad-up', version: 1, status: 'LAUNCH' };
      prisma.membershipPlanVersion.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(launch);

      const result = await service.getActivePlanVersion('trad-up');

      expect(result).toEqual(launch);
    });

    it('should return null for DRAFT/ARCHIVED-only plans (never served)', async () => {
      prisma.membershipPlanVersion.findFirst.mockResolvedValue(null);

      await expect(service.getActivePlanVersion('trade_plus')).resolves.toBeNull();
      expect(prisma.membershipPlanVersion.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('getVersionedEntitlements + enforcePriceTierLimit (2B-2B)', () => {
    const versionRow = (features: any[]) => ({
      id: 'ver-1', planId: 'trade_start', version: 1, status: 'PUBLIC', features,
    });

    it('should return null for a legacy NULL-version company', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_plus', subscriptionPlan: 'TRADE_PLUS', currentPlanVersionId: null });
      prisma.planFeature.findMany.mockResolvedValue([]);
      await expect(service.getVersionedEntitlements('company-1')).resolves.toBeNull();
      expect(prisma.membershipPlanVersion.findUnique).not.toHaveBeenCalled();
    });

    it('should return the snapshot map for a version-pinned company', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_start', subscriptionPlan: 'TRADE_START', currentPlanVersionId: 'ver-1' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(
        versionRow([{ feature: 'price_tiers', included: true, value: '1' }]),
      );
      const snap = await service.getVersionedEntitlements('company-1');
      expect(snap).toEqual({ price_tiers: { included: true, value: '1' } });
    });

    it('should return null when the version ref dangles', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_plus', subscriptionPlan: 'TRADE_PLUS', currentPlanVersionId: 'deleted' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(null);
      prisma.membershipPlan.findUnique.mockResolvedValue({ planFeatures: [] });
      prisma.planFeature.findMany.mockResolvedValue([]);
      await expect(service.getVersionedEntitlements('company-1')).resolves.toBeNull();
    });

    it('should no-op the slab cap for legacy subscribers', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: null, subscriptionPlan: 'TRADE_PLUS', currentPlanVersionId: null });
      prisma.membershipPlan.findUnique.mockResolvedValue({ planFeatures: [] });
      prisma.planFeature.findMany.mockResolvedValue([]);
      await expect(service.enforcePriceTierLimit('company-1', 99, 0)).resolves.toBeUndefined();
    });

    it('should block a versioned Start company adding a second slab', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_start', subscriptionPlan: 'TRADE_START', currentPlanVersionId: 'ver-1' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(
        versionRow([{ feature: 'price_tiers', included: true, value: '1' }]),
      );
      await expect(service.enforcePriceTierLimit('company-1', 2, 0)).rejects.toThrow(BadRequestException);
    });

    it('should allow an update that keeps an over-cap grandfathered slab count', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_start', subscriptionPlan: 'TRADE_START', currentPlanVersionId: 'ver-1' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(
        versionRow([{ feature: 'price_tiers', included: true, value: '1' }]),
      );
      await expect(service.enforcePriceTierLimit('company-1', 3, 3)).resolves.toBeUndefined();
      await expect(service.enforcePriceTierLimit('company-1', 4, 3)).rejects.toThrow(BadRequestException);
    });

    it('should allow unlimited slabs for an advanced (Elite) snapshot', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_elite', subscriptionPlan: 'TRADE_ELITE', currentPlanVersionId: 'ver-9' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(
        versionRow([{ feature: 'price_tiers', included: true, value: 'advanced' }]),
      );
      await expect(service.enforcePriceTierLimit('company-1', 100, 0)).resolves.toBeUndefined();
    });

    it('should no-op when the snapshot lacks the price_tiers key', async () => {
      prisma.company.findUnique.mockResolvedValue({ currentPlanId: 'trade_smart', subscriptionPlan: 'TRADE_SMART', currentPlanVersionId: 'ver-2' });
      prisma.membershipPlanVersion.findUnique.mockResolvedValue(
        versionRow([{ feature: 'rfq_monthly_limit', included: true, value: '20' }]),
      );
      await expect(service.enforcePriceTierLimit('company-1', 50, 0)).resolves.toBeUndefined();
    });
  });

  describe('getEntitlementMatrix (P2A read path)', () => {
    it('should serve the canonical matrix without touching legacy PlanFeature rows', async () => {
      const m = await service.getEntitlementMatrix();

      expect(m.plans).toHaveLength(6);
      expect(m.rows.length).toBeGreaterThan(0);
      expect(prisma.planFeature.findMany).not.toHaveBeenCalled();
      expect(prisma.membershipPlan.findMany).not.toHaveBeenCalled();
    });
  });

  describe('admin safe availability controls (P2D verification)', () => {
    it('should hide a plan via ARCHIVED visibility and audit the change', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ planId: 'trade_plus', name: 'Trade Plus', visibility: 'PUBLIC' });
      prisma.membershipPlan.update.mockResolvedValue({ planId: 'trade_plus', visibility: 'ARCHIVED' });

      const result = await service.adminUpdatePlanVisibility('trade_plus', 'ARCHIVED' as any, 'admin-1');

      expect(prisma.membershipPlan.update).toHaveBeenCalledWith({
        where: { planId: 'trade_plus' },
        data: { visibility: 'ARCHIVED' },
      });
      expect(prisma.planAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'VISIBILITY_CHANGED' }) }),
      );
      expect(result.visibility).toBe('ARCHIVED');
    });

    it('should refuse deleting a plan with active subscriptions (history preserved)', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ planId: 'trade_plus', name: 'Trade Plus' });
      prisma.company.count.mockResolvedValue(3);

      await expect(service.adminDeletePlan('trade_plus')).rejects.toThrow(BadRequestException);
      expect(prisma.membershipPlan.delete).not.toHaveBeenCalled();
    });

    it('should delete only with zero active subscriptions and audit it', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue({ planId: 'trad-up', name: 'TRAD UP' });
      prisma.company.count.mockResolvedValue(0);
      prisma.membershipPlan.delete.mockResolvedValue({ planId: 'trad-up' });

      const result = await service.adminDeletePlan('trad-up');

      expect(prisma.membershipPlan.delete).toHaveBeenCalledWith({ where: { planId: 'trad-up' } });
      expect(result.success).toBe(true);
    });
  });
});
