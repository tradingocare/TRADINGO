import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import { createMockPrisma } from '../../common/test/test-utils';

describe('CampaignService', () => {
  let service: CampaignService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let gocashService: jest.Mocked<Pick<GocashService, 'credit'>>;

  const mockCampaign = {
    id: 'camp-1',
    name: 'Summer Sale',
    description: 'Summer discount campaign',
    type: 'DISCOUNT',
    status: 'ACTIVE',
    budget: 100000,
    spent: 0,
    budgetType: 'TOTAL',
    currency: 'GOCASH',
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-12-31'),
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    maxClaimsPerUser: 1,
    maxClaimsPerCompany: 5,
    dailyLimit: 1000,
    rewardAmount: 100,
    rewardType: 'GOCASH',
    conditions: null,
    metadata: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClaim = {
    id: 'claim-1',
    campaignId: 'camp-1',
    userId: 'user-2',
    companyId: 'company-2',
    status: 'PENDING',
    rewardAmount: 100,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    gocashService = { credit: jest.fn().mockResolvedValue({ id: 'tx-1', direction: 'CREDIT', status: 'SUCCESS' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: PrismaService, useValue: prisma },
        { provide: GocashService, useValue: gocashService },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campaign with rules and targets', async () => {
      prisma.campaign.create.mockResolvedValue(mockCampaign);
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.create({
        name: 'Summer Sale',
        type: 'DISCOUNT' as any,
        status: 'ACTIVE' as any,
        budget: 100000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        rewardAmount: 100,
        rewardType: 'GOCASH',
        rules: [],
        targets: [],
      }, 'user-1');

      expect(result).toBeDefined();
      expect(prisma.campaign.create).toHaveBeenCalled();
    });

    it('should create campaign without optional rules/targets', async () => {
      prisma.campaign.create.mockResolvedValue(mockCampaign);
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.create({
        name: 'Simple Campaign',
        type: 'SIGNUP_BONUS' as any,
        status: 'ACTIVE' as any,
        budget: 50000,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        rewardAmount: 50,
        rewardType: 'GOCASH',
      }, 'user-1');

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated campaigns', async () => {
      prisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      prisma.campaign.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply type filter', async () => {
      prisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      prisma.campaign.count.mockResolvedValue(1);

      await service.findAll({ type: 'DISCOUNT' as any, page: 1, limit: 20 });
      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'DISCOUNT' }),
        }),
      );
    });

    it('should return empty list when no campaigns', async () => {
      prisma.campaign.findMany.mockResolvedValue([]);
      prisma.campaign.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return campaign by id', async () => {
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      const result = await service.findById('camp-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('camp-1');
    });

    it('should throw NotFoundException for missing campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('claimReward', () => {
    it('should claim reward for active campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      prisma.gOCASH_Wallet.findUnique.mockResolvedValue({ id: 'wallet-1' });
      prisma.campaignClaim.create.mockResolvedValue({ ...mockClaim, status: 'APPROVED' });
      prisma.campaignClaim.findUnique.mockResolvedValue({ ...mockClaim, status: 'APPROVED' });
      prisma.campaignAnalytics.upsert.mockResolvedValue({ id: 'analytics-1', campaignId: 'camp-1', totalClaims: 1, totalSpent: 100 });
      prisma.campaign.update.mockResolvedValue(mockCampaign);

      const result = await service.claimReward({
        campaignId: 'camp-1',
        userId: 'user-2',
        companyId: 'company-2',
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('APPROVED');
    });

    it('should reject claim for inactive campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'PAUSED' });
      await expect(service.claimReward({ campaignId: 'camp-1', userId: 'user-2', companyId: 'company-2' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject claim for expired campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, endDate: new Date('2020-01-01') });
      await expect(service.claimReward({ campaignId: 'camp-1', userId: 'user-2', companyId: 'company-2' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate claim', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, perUserLimit: 1 });
      prisma.campaignClaim.count.mockResolvedValue(1);
      await expect(service.claimReward({ campaignId: 'camp-1', userId: 'user-2', companyId: 'company-2' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject claim when budget exhausted', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, budget: 1000, remainingBudget: 0 });
      await expect(service.claimReward({ campaignId: 'camp-1', userId: 'user-2', companyId: 'company-2' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      prisma.campaign.update.mockResolvedValue({ ...mockCampaign, name: 'Updated Campaign' });

      const result = await service.update('camp-1', { name: 'Updated Campaign' });
      expect(result).toBeDefined();
    });

    it('should throw on missing campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a campaign', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'DRAFT' });
      prisma.campaign.update.mockResolvedValue(mockCampaign);
      const result = await service.delete('camp-1');
      expect(result).toBeDefined();
    });
  });

  describe('getActiveCampaigns', () => {
    it('should return active campaigns', async () => {
      prisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      const result = await service.getActiveCampaigns('user-1', 'company-1');
      expect(result).toBeDefined();
    });

    it('should return empty array when no active campaigns', async () => {
      prisma.campaign.findMany.mockResolvedValue([]);
      const result = await service.getActiveCampaigns('user-1', 'company-1');
      expect(result).toHaveLength(0);
    });
  });
});
