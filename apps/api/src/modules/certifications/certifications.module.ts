import { Module } from '@nestjs/common';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [CertificationsController],
  providers: [CertificationsService, CompanyOwnerGuard],
  exports: [CertificationsService],
})
export class CertificationsModule {}
