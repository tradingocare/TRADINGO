import { Test, TestingModule } from '@nestjs/testing';
import { FinanceAggregatorService } from './aggregator.service';
import { FinanceDashboardService } from './finance-dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../../common/test/test-utils';

describe('FinanceAggregatorService', () => {
  let service: FinanceAggregatorService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceAggregatorService,
        { provide: PrismaService, useValue: prisma },
        { provide: FinanceDashboardService, useValue: { getDashboard: jest.fn().mockResolvedValue({ monthlySummary: [] }) } },
      ],
    }).compile();

    service = module.get<FinanceAggregatorService>(FinanceAggregatorService);
    jest.clearAllMocks();
  });

  describe('getDashboardCards', () => {
    it('should return dashboard card metrics', async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000000 } });
      prisma.settlement.count.mockResolvedValue(5);
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: 500000, commissionAmount: 25000 } });
      prisma.refund.count.mockResolvedValue(2);
      prisma.dispute.count.mockResolvedValue(1);

      const result = await service.getDashboardCards();
      expect(result).toBeDefined();
      expect(result.totalRevenue).toBeGreaterThan(0);
      expect(result.pendingSettlements).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero aggregates', async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
      prisma.settlement.count.mockResolvedValue(0);
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: null, commissionAmount: null } });
      prisma.refund.count.mockResolvedValue(0);
      prisma.dispute.count.mockResolvedValue(0);

      const result = await service.getDashboardCards();
      expect(result.totalRevenue).toBe(0);
      expect(result.pendingSettlements).toBe(0);
      expect(result.escrowBalance).toBe(0);
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should return revenue data for daily period', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'pay-1', amount: 50000, status: 'CAPTURED', paidAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      ]);
      const result = await service.getRevenueAnalytics('daily');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return revenue data for monthly period', async () => {
      const result = await service.getRevenueAnalytics('monthly');
      expect(result).toBeDefined();
    });
  });

  describe('getSettlements', () => {
    it('should return paginated settlements', async () => {
      prisma.settlement.findMany.mockResolvedValue([
        { id: 'settle-1', status: 'PROCESSED', amount: 50000, escrowId: 'escrow-1', processedAt: new Date(), settledAt: new Date(), createdAt: new Date(), updatedAt: new Date(), escrow: null },
      ]);
      prisma.settlement.count.mockResolvedValue(1);
      const result = await service.getSettlements();
      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getRefunds', () => {
    it('should return paginated refunds', async () => {
      prisma.refund.findMany.mockResolvedValue([
        { id: 'refund-1', amount: 5000, status: 'COMPLETED', reason: 'test', paymentId: 'pay-1', gatewayRefundId: null, createdAt: new Date(), updatedAt: new Date(), payment: null },
      ]);
      prisma.refund.count.mockResolvedValue(1);
      const result = await service.getRefunds();
      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getDisputes', () => {
    it('should return paginated disputes', async () => {
      prisma.dispute.findMany.mockResolvedValue([
        { id: 'disp-1', disputeNumber: 'DSP-001', type: 'ORDER', status: 'OPEN', reason: 'Issue', amount: 10000, bookingId: null, createdAt: new Date(), updatedAt: new Date(), booking: null, raisedByCompany: null, againstCompany: null, timeline: [], resolution: null },
      ]);
      prisma.dispute.count.mockResolvedValue(1);
      const result = await service.getDisputes();
      expect(result.data).toBeDefined();
    });
  });

  describe('getCommissions', () => {
    it('should return commission metrics', async () => {
      prisma.escrow.count.mockResolvedValue(5);
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { commissionAmount: 25000 } });
      prisma.escrow.findMany.mockResolvedValue([]);
      prisma.commissionRule.findMany.mockResolvedValue([]);
      const result = await service.getCommissions();
      expect(result.totalCommissions).toBe(5);
    });
  });

  describe('getReconciliation', () => {
    it('should return reconciliation data', async () => {
      prisma.escrow.findMany.mockResolvedValue([]);
      prisma.escrow.count.mockResolvedValue(0);
      const result = await service.getReconciliation();
      expect(result.data).toBeDefined();
    });
  });
});
