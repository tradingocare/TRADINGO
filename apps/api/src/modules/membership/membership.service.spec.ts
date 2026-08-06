import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../../common/test/test-utils';
import { InvoiceService } from '../billing/invoice.service';
import { TaxService } from '../billing/tax.service';

describe('MembershipService', () => {
  let service: MembershipService;
  let prisma: ReturnType<typeof createMockPrisma>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoiceService, useValue: { createSubscriptionInvoice: jest.fn().mockResolvedValue({ invoiceNumber: 'INV-001' }) } },
        { provide: TaxService, useValue: { calculateTax: jest.fn().mockResolvedValue({ gst: 1800, total: 13800 }) } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    jest.clearAllMocks();
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

  describe('createOrder', () => {
    it('should create order for plan', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue(mockPlan);
      const result = await service.createOrder('company-1', 'trade_smart', 'A', 1);
      expect(result).toBeDefined();
      expect(result.orderId).toContain('ORD-');
      expect(result.amount).toBeGreaterThan(0);
    });

    it('should throw on missing plan', async () => {
      prisma.membershipPlan.findUnique.mockResolvedValue(null);
      await expect(service.createOrder('c1', 'bad', 'A', 1)).rejects.toThrow(NotFoundException);
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
});
