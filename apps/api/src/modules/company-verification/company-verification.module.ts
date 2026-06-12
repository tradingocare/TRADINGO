import { Module } from '@nestjs/common';
import { CompanyVerificationController } from './company-verification.controller';
import { CompanyVerificationService } from './company-verification.service';
import { VendorCodesModule } from '../vendor-codes/vendor-codes.module';

@Module({
  imports: [VendorCodesModule],
  controllers: [CompanyVerificationController],
  providers: [CompanyVerificationService],
  exports: [CompanyVerificationService],
})
export class CompanyVerificationModule {}
