import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingStep } from '@prisma/client';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  private readonly stepOrder: OnboardingStep[] = [
    'ACCOUNT_CREATED',
    'BUSINESS_ADDED',
    'KYC_STARTED',
    'KYC_COMPLETED',
    'PRODUCTS_ADDED',
    'SUBSCRIPTION_ACTIVATED',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        onboardingLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!company) return null;

    const completedSteps = company.onboardingLogs
      .filter((l) => l.completed)
      .map((l) => l.step);

    const currentStepIndex = this.stepOrder.findIndex(
      (s) => !completedSteps.includes(s),
    );

    return {
      companyId: company.id,
      currentStep: currentStepIndex >= 0 ? this.stepOrder[currentStepIndex] : 'COMPLETED',
      completedSteps,
      remainingSteps: this.stepOrder.filter((s) => !completedSteps.includes(s)),
      progress: Math.round((completedSteps.length / this.stepOrder.length) * 100),
      totalSteps: this.stepOrder.length,
      startedAt: company.onboardingStartedAt,
      completedAt: company.onboardingCompletedAt,
    };
  }

  async advanceStep(companyId: string, step: OnboardingStep, _userId?: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company) return null;

    const existing = await this.prisma.companyOnboardingLog.findFirst({
      where: { companyId, step },
    });
    if (existing) return this.getStatus(companyId);

    await this.prisma.companyOnboardingLog.create({
      data: { companyId, step, completed: true },
    });

    const stepIndex = this.stepOrder.indexOf(step);
    if (stepIndex >= 0 && stepIndex < this.stepOrder.length - 1) {
      const nextStep = this.stepOrder[stepIndex + 1];
      await this.prisma.companyOnboardingLog.create({
        data: { companyId, step: nextStep, completed: false },
      });
    }

    const updateData: Record<string, unknown> = {
      onboardingStatus: step,
      onboardingStartedAt: company.onboardingStartedAt ?? (step === 'ACCOUNT_CREATED' ? new Date() : undefined),
    };

    if (step === 'KYC_COMPLETED') {
      updateData.onboardingCompletedAt = new Date();
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: updateData as PrismaNamespace,
    });

    this.logger.log(`Onboarding step ${step} advanced for company ${companyId}`);
    return this.getStatus(companyId);
  }

  async isOnboardingComplete(companyId: string): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { onboardingCompletedAt: true, onboardingStatus: true },
    });
    return !!(company?.onboardingCompletedAt || company?.onboardingStatus === 'KYC_COMPLETED');
  }
}

type PrismaNamespace = {
  onboardingStatus?: OnboardingStep;
  onboardingStartedAt?: Date;
  onboardingCompletedAt?: Date;
};
