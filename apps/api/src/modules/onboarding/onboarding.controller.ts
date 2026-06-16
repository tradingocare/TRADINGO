import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep } from '@prisma/client';

@ApiTags('Onboarding')
@Controller('companies/:companyId/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@Param('companyId') companyId: string) {
    return this.onboardingService.getStatus(companyId);
  }

  @Post('advance')
  @ApiOperation({ summary: 'Advance onboarding step' })
  async advanceStep(
    @Param('companyId') companyId: string,
    @Body('step') step: OnboardingStep,
  ) {
    return this.onboardingService.advanceStep(companyId, step);
  }

  @Get('complete')
  @ApiOperation({ summary: 'Check if onboarding is complete' })
  async isComplete(@Param('companyId') companyId: string) {
    const complete = await this.onboardingService.isOnboardingComplete(companyId);
    return { complete };
  }
}
