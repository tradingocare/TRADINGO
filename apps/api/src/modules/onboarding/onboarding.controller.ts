import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdvanceOnboardingStepDto } from './dto/advance-onboarding-step.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle(RateLimits.WRITE_GENERAL)
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
    @Body() dto: AdvanceOnboardingStepDto,
  ) {
    return this.onboardingService.advanceStep(companyId, dto.step);
  }

  @Get('complete')
  @ApiOperation({ summary: 'Check if onboarding is complete' })
  async isComplete(@Param('companyId') companyId: string) {
    const complete = await this.onboardingService.isOnboardingComplete(companyId);
    return { complete };
  }
}
