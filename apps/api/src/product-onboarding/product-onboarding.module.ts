import { Module } from '@nestjs/common';
import { ProductOnboardingController } from './product-onboarding.controller';
import { ProductOnboardingService } from './product-onboarding.service';
import { SearchModule } from '../modules/search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [ProductOnboardingController],
  providers: [ProductOnboardingService],
  exports: [ProductOnboardingService],
})
export class ProductOnboardingModule {}
