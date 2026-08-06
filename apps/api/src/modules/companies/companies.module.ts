import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { SearchModule } from '../search/search.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { ProfileCompletionService } from '../profile-completion/profile-completion.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { TradTrustModule } from '../tradtrust/tradtrust.module';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';

@Module({
  imports: [SearchModule, TradTrustModule],
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompanyOwnerGuard,
    ProfileCompletionService,
    OnboardingService,
    VendorCodesService,
  ],
  exports: [CompaniesService],
})
export class CompaniesModule {}
