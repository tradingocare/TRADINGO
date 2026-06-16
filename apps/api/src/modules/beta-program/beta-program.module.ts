import { Module } from '@nestjs/common';
import { BetaProgramService } from './beta-program.service';
import { BetaInvitesController } from './beta-invites.controller';
import { BetaFeedbackController } from './beta-feedback.controller';
import { BetaTrackingController } from './beta-tracking.controller';
import { BetaOnboardingController } from './beta-onboarding.controller';
import { BetaSupportController } from './beta-support.controller';
import { BetaDashboardController } from './beta-dashboard.controller';

@Module({
  controllers: [
    BetaInvitesController,
    BetaFeedbackController,
    BetaTrackingController,
    BetaOnboardingController,
    BetaSupportController,
    BetaDashboardController,
  ],
  providers: [BetaProgramService],
  exports: [BetaProgramService],
})
export class BetaProgramModule {}
