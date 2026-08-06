import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import { createMockPrisma, createMockRedis } from '../../common/test/test-utils';

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let gocashService: jest.Mocked<Pick<GocashService, 'credit'>>;

  const mockReferralCode = {
    id: 'ref-1',
    code: 'TRADabc123',
    userId: 'user-1',
    companyId: 'company-1',
    type: 'BUYER',
    status: 'ACTIVE',
    rewardAmount: 100,
    rewardType: 'GOCASH',
    currentUsage: 0,
    maxUsage: 100,
    expiresAt: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsage = {
    id: 'usage-1',
    referralCodeId: 'ref-1',
    referredUserId: 'user-2',
    referredCompanyId: 'company-2',
    status: 'COMPLETED',
    rewardAmount: 100,
    createdAt: new Date(),
    referralCode: mockReferralCode,
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    gocashService = { credit: jest.fn().mockResolvedValue({ id: 'tx-1', walletId: 'wallet-1', direction: 'CREDIT', status: 'SUCCESS' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: prisma },
        { provide: GocashService, useValue: gocashService },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    jest.clearAllMocks();
  });

  describe('createReferralCode', () => {
    it('should create a referral code', async () => {
      prisma.referralCode.create.mockResolvedValue(mockReferralCode);
      prisma.referralAudit.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.createReferralCode({
        userId: 'user-1',
        type: 'BUYER' as any,
      });

      expect(result).toBeDefined();
      expect(result.code).toMatch(/^TRAD/);
      expect(prisma.referralCode.create).toHaveBeenCalled();
    });

    it('should throw if user has an active code of same type', async () => {
      prisma.referralCode.findFirst.mockResolvedValue(mockReferralCode);
      await expect(service.createReferralCode({ userId: 'user-1', type: 'BUYER' as any }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('validateReferral', () => {
    it('should validate an active code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(mockReferralCode);
      const result = await service.validateReferral({ code: 'TRADabc123' });
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should reject inactive code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({ ...mockReferralCode, status: 'EXPIRED' });
      const result = await service.validateReferral({ code: 'TRADabc123' });
      expect(result.valid).toBe(false);
    });

    it('should reject non-existent code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(null);
      const result = await service.validateReferral({ code: 'INVALID' });
      expect(result.valid).toBe(false);
    });

    it('should reject expired code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({ ...mockReferralCode, expiresAt: new Date('2020-01-01') });
      const result = await service.validateReferral({ code: 'TRADabc123' });
      expect(result.valid).toBe(false);
    });
  });

  describe('applyReferral', () => {
    it('should apply a referral code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(mockReferralCode);
      prisma.referralUsage.findFirst.mockResolvedValue(null);
      prisma.referralBlacklist.findFirst.mockResolvedValue(null);
      prisma.referralUsage.create.mockResolvedValue(mockUsage);
      prisma.referralReward.create.mockResolvedValue({ id: 'reward-1', usageId: 'usage-1', amount: 100, status: 'PENDING' });
      prisma.referralCode.update.mockResolvedValue({ ...mockReferralCode, currentUsage: 1 });
      prisma.referralAudit.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.applyReferral({
        code: 'TRADabc123',
        refereeUserId: 'user-2',
        refereeEmail: 'new@test.com',
      });

      expect(result).toBeDefined();
    });

    it('should reject self-referral', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(mockReferralCode);
      await expect(service.applyReferral({ code: 'TRADabc123', refereeUserId: 'user-1', refereeEmail: 'self@test.com' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject referral with already applied code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue(mockReferralCode);
      prisma.referralUsage.findFirst.mockResolvedValue(mockUsage);
      await expect(service.applyReferral({ code: 'TRADabc123', refereeUserId: 'user-2', refereeEmail: 'dup@test.com' }))
        .rejects.toThrow(ConflictException);
    });

    it('should reject expired referral code', async () => {
      prisma.referralCode.findUnique.mockResolvedValue({ ...mockReferralCode, expiresAt: new Date('2020-01-01') });
      await expect(service.applyReferral({ code: 'TRADabc123', refereeUserId: 'user-2', refereeEmail: 'test@test.com' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyReferralCode', () => {
    it('should return referral code for user', async () => {
      prisma.referralCode.findFirst.mockResolvedValue(mockReferralCode);
      const result = await service.getMyReferralCode('user-1');
      expect(result).not.toBeNull();
      expect(result!.code).toBe('TRADabc123');
    });
  });

  describe('getReferralStatistics', () => {
    it('should return referral statistics', async () => {
      prisma.referralCode.findMany.mockResolvedValue([mockReferralCode]);
      prisma.referralUsage.findMany.mockResolvedValue([mockUsage]);
      const result = await service.getReferralStatistics('user-1');
      expect(result).toBeDefined();
      expect(result.totalCodes).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats when no codes exist', async () => {
      prisma.referralCode.findMany.mockResolvedValue([]);
      prisma.referralUsage.findMany.mockResolvedValue([]);
      const result = await service.getReferralStatistics('user-1');
      expect(result.totalCodes).toBe(0);
      expect(result.totalRewardsEarned).toBe(0);
    });
  });

  describe('getReferralHistory', () => {
    it('should return referral history', async () => {
      prisma.referralCode.findMany.mockResolvedValue([mockReferralCode]);
      prisma.referralUsage.findMany.mockResolvedValue([mockUsage]);
      prisma.referralReward.findMany.mockResolvedValue([]);
      const result = await service.getReferralHistory('user-1');
      expect(result).toBeDefined();
      expect(result.usages).toHaveLength(1);
    });
  });

  describe('getReferralAudit', () => {
    it('should return audit log', async () => {
      prisma.referralAudit.findMany.mockResolvedValue([{ id: 'audit-1', usageId: 'usage-1', action: 'CREATED', detail: 'Code created', actorId: 'user-1', createdAt: new Date() }]);
      const result = await service.getReferralAudit('user-1');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });
});
