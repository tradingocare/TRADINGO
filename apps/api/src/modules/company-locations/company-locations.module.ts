import { Module } from '@nestjs/common';
import { CompanyLocationsController } from './company-locations.controller';
import { CompanyLocationsService } from './company-locations.service';

@Module({
  controllers: [CompanyLocationsController],
  providers: [CompanyLocationsService],
  exports: [CompanyLocationsService],
})
export class CompanyLocationsModule {}
