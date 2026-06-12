import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const companyWithLogs = {
    id: 'c1',
    onboardingStartedAt: new Date(),
    onboardingCompletedAt: null,
    onboardingLogs: [
      { step: 'ACCOUNT_CREATED', completed: true },
      { step: 'BUSINESS_ADDED', completed: true },
      { step: 'KYC_STARTED', completed: true },
    ],
  };

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn(), update: jest.fn() },
      companyOnboardingLog: { findFirst: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('getStatus', () => {
    it('should return onboarding status', async () => {
      prisma.company.findFirst.mockResolvedValue(companyWithLogs);
      const status = await service.getStatus('c1');
      expect(status?.currentStep).toBe('KYC_COMPLETED');
      expect(status?.completedSteps).toHaveLength(3);
      expect(status?.progress).toBe(50);
    });

    it('should return null for non-existent company', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      const status = await service.getStatus('unknown');
      expect(status).toBeNull();
    });
  });

  describe('advanceStep', () => {
    it('should advance onboarding to next step', async () => {
      prisma.company.findFirst.mockResolvedValue(companyWithLogs);
      prisma.companyOnboardingLog.findFirst.mockResolvedValue(null);
      prisma.companyOnboardingLog.create.mockResolvedValue({} as any);
      prisma.company.update.mockResolvedValue({} as any);

      const result = await service.advanceStep('c1', 'KYC_COMPLETED');
      expect(result).toBeDefined();
    });

    it('should skip if step already logged', async () => {
      prisma.company.findFirst.mockResolvedValue(companyWithLogs);
      prisma.companyOnboardingLog.findFirst.mockResolvedValue({ id: 'existing' } as any);
      const result = await service.advanceStep('c1', 'ACCOUNT_CREATED');
      expect(result).toBeDefined();
      expect(prisma.companyOnboardingLog.create).not.toHaveBeenCalled();
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true when onboarding completed', async () => {
      prisma.company.findFirst.mockResolvedValue({ onboardingCompletedAt: new Date(), onboardingStatus: 'KYC_COMPLETED' });
      const complete = await service.isOnboardingComplete('c1');
      expect(complete).toBe(true);
    });

    it('should return false when not completed', async () => {
      prisma.company.findFirst.mockResolvedValue({ onboardingCompletedAt: null, onboardingStatus: 'BUSINESS_ADDED' });
      const complete = await service.isOnboardingComplete('c1');
      expect(complete).toBe(false);
    });
  });
});
