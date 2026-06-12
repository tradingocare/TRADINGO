import { Module } from '@nestjs/common';
import { GoCashController } from './go-cash.controller';
import { GoCashService } from './go-cash.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  controllers: [GoCashController],
  providers: [GoCashService, CompanyOwnerGuard],
  exports: [GoCashService],
})
export class GoCashModule {}
