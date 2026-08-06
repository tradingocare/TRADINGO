import { IsEnum, IsNotEmpty } from 'class-validator';
import { OnboardingStep } from '@prisma/client';

export class AdvanceOnboardingStepDto {
  @IsEnum(OnboardingStep)
  @IsNotEmpty()
  step: OnboardingStep;
}
