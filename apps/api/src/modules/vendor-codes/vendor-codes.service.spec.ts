import { Test, TestingModule } from '@nestjs/testing';
import { VendorCodesService } from './vendor-codes.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VendorCodesService', () => {
  let service: VendorCodesService;

  const mockPrisma = {
    vendorCodeSequence: { upsert: jest.fn() },
    company: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    codeAttribution: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    goCashTransaction: { create: jest.fn(), findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorCodesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<VendorCodesService>(VendorCodesService);
  });

  describe('generateVendorCode', () => {
    it('should generate TRVMMYY0001 format code', async () => {
      mockPrisma.vendorCodeSequence.upsert.mockResolvedValue({ prefix: 'TRV', period: '0626', sequence: 1 } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code = await service.generateVendorCode('company-1');
      expect(code).toMatch(/^TRV\d{4}0001$/);
      expect(code.length).toBe(11);
    });

    it('should increment sequence within same month', async () => {
      mockPrisma.vendorCodeSequence.upsert
        .mockResolvedValueOnce({ prefix: 'TRV', period: '0626', sequence: 5 } as any)
        .mockResolvedValueOnce({ prefix: 'TRV', period: '0626', sequence: 6 } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code1 = await service.generateVendorCode('company-1');
      const code2 = await service.generateVendorCode('company-2');
      expect(code1).toContain('0005');
      expect(code2).toContain('0006');
    });

    it('should reset sequence when month changes', async () => {
      mockPrisma.vendorCodeSequence.upsert
        .mockResolvedValueOnce({ prefix: 'TRV', period: '0626', sequence: 12 } as any)
        .mockResolvedValueOnce({ prefix: 'TRV', period: '0726', sequence: 1 } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code = await service.generateVendorCode('company-new');
      expect(code).toMatch(/^TRV\d{8}$/);
    });

    it('should support up to 9999 registrations per month', async () => {
      mockPrisma.vendorCodeSequence.upsert.mockResolvedValue({ prefix: 'TRV', period: '0626', sequence: 9999 } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code = await service.generateVendorCode('company-high');
      expect(code).toBe('TRV06269999');
    });
  });

  describe('generateRmCode', () => {
    it('should generate TRMMMYY0001 format code', async () => {
      mockPrisma.vendorCodeSequence.upsert.mockResolvedValue({ prefix: 'TRM', period: '0626', sequence: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code = await service.generateRmCode('user-1');
      expect(code).toMatch(/^TRM\d{4}0001$/);
      expect(code.length).toBe(11);
    });
  });

  describe('generateMeCode', () => {
    it('should generate TMEMMYY0001 format code', async () => {
      mockPrisma.vendorCodeSequence.upsert.mockResolvedValue({ prefix: 'TME', period: '0626', sequence: 1 } as any);
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      mockPrisma.codeAttribution.create.mockResolvedValue({} as any);
      const code = await service.generateMeCode('user-1');
      expect(code).toMatch(/^TME\d{4}0001$/);
    });
  });

  describe('getCodeOwner', () => {
    it('should find vendor code owner', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'c1', name: 'Test Co' } as any);
      const owner = await service.getCodeOwner('TRV06260001');
      expect(owner?.type).toBe('VENDOR');
      expect(owner?.companyId).toBe('c1');
    });

    it('should find RM code owner', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', name: 'RM User', rmCode: 'TRM06260001' } as any);
      const owner = await service.getCodeOwner('TRM06260001');
      expect(owner?.type).toBe('RM');
      expect(owner?.userId).toBe('u1');
    });

    it('should find ME code owner', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', name: 'ME User', meCode: 'TME06260001' } as any);
      const owner = await service.getCodeOwner('TME06260001');
      expect(owner?.type).toBe('ME');
    });

    it('should return null for unknown code', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const owner = await service.getCodeOwner('UNKNOWN');
      expect(owner).toBeNull();
    });
  });

  describe('trackAttribution', () => {
    it('should update attribution counts', async () => {
      mockPrisma.codeAttribution.findUnique.mockResolvedValue({
        code: 'TRM06260001', leadCount: 5, revenueAttribution: 1000, sellerCount: 2, buyerCount: 3, commissionAmount: 100,
      } as any);
      mockPrisma.codeAttribution.update.mockResolvedValue({} as any);
      await service.trackAttribution('TRM06260001', { leadCount: 1, sellerCount: 1, revenueAttribution: 500 });
      expect(mockPrisma.codeAttribution.update).toHaveBeenCalledWith({
        where: { code: 'TRM06260001' },
        data: expect.objectContaining({ leadCount: 6, sellerCount: 3, revenueAttribution: 1500 }),
      });
    });

    it('should skip update when attribution not found', async () => {
      mockPrisma.codeAttribution.findUnique.mockResolvedValue(null);
      await service.trackAttribution('NONE', { leadCount: 1 });
      expect(mockPrisma.codeAttribution.update).not.toHaveBeenCalled();
    });
  });

  describe('assignReferral', () => {
    it('should assign referral code', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', name: 'RM User', rmCode: 'TRM06260001' } as any);
      mockPrisma.company.findFirst.mockResolvedValue({
        id: 'company-new', onboardedByCode: null, referralRewardedAt: null, owners: [{ userId: 'other-user' }], createdBy: 'other-user',
      } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      const owner = await service.assignReferral('company-new', 'TRM06260001');
      expect(owner?.type).toBe('RM');
      expect(mockPrisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { onboardedByCode: 'TRM06260001' } }),
      );
    });

    it('should throw for invalid referral code', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.assignReferral('company-new', 'INVALID')).rejects.toThrow('Invalid referral code');
    });

    it('should throw for self-referral', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', rmCode: 'TRM06260001' } as any);
      mockPrisma.company.findFirst.mockResolvedValue({
        id: 'company-new', owners: [{ userId: 'u1' }], createdBy: 'u1', onboardedByCode: null, referralRewardedAt: null,
      } as any);
      await expect(service.assignReferral('company-new', 'TRM06260001')).rejects.toThrow('Self-referral is not allowed');
    });

    it('should throw for already assigned referral', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', rmCode: 'TRM06260001' } as any);
      mockPrisma.company.findFirst.mockResolvedValue({
        id: 'company-new', onboardedByCode: 'EXISTING', owners: [{ userId: 'other' }], createdBy: 'other',
      } as any);
      await expect(service.assignReferral('company-new', 'TRM06260001')).rejects.toThrow('already has a referral code');
    });
  });

  describe('rewardReferral', () => {
    it('should reward referral on KYC completion', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({
        id: 'company-new', onboardedByCode: 'TRM06260001', referralRewardedAt: null, goCashBalance: 100,
      } as any);
      mockPrisma.company.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1', rmCode: 'TRM06260001' } as any);
      mockPrisma.company.update.mockResolvedValue({} as any);
      mockPrisma.codeAttribution.findUnique.mockResolvedValue({ code: 'TRM06260001', sellerCount: 0 } as any);
      mockPrisma.codeAttribution.update.mockResolvedValue({} as any);
      mockPrisma.goCashTransaction.create.mockResolvedValue({} as any);
      const result = await service.rewardReferral('company-new', 'KYC_COMPLETED');
      expect(result).toBe(true);
    });

    it('should return false if already rewarded', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({
        onboardedByCode: 'TRM06260001', referralRewardedAt: new Date(), goCashBalance: 100,
      } as any);
      const result = await service.rewardReferral('company-new', 'KYC_COMPLETED');
      expect(result).toBe(false);
    });

    it('should return false if no referral code', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({
        onboardedByCode: null, referralRewardedAt: null, goCashBalance: 100,
      } as any);
      const result = await service.rewardReferral('company-new', 'KYC_COMPLETED');
      expect(result).toBe(false);
    });
  });

  describe('getCompanyByVendorCode', () => {
    it('should find company by vendor code', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ id: 'c1', name: 'Test' } as any);
      const company = await service.getCompanyByVendorCode('TRV06260001');
      expect(company?.id).toBe('c1');
    });
  });

  describe('getAttribution', () => {
    it('should return attribution record', async () => {
      mockPrisma.codeAttribution.findUnique.mockResolvedValue({ code: 'TRM06260001', leadCount: 10 } as any);
      const attr = await service.getAttribution('TRM06260001');
      expect(attr?.leadCount).toBe(10);
    });
  });
});
