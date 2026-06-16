import { Module } from '@nestjs/common';
import { TradmatchController } from './tradmatch.controller';
import { TradmatchService } from './tradmatch.service';
import { RfqModule } from '../rfq/rfq.module';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@Module({
  imports: [RfqModule],
  controllers: [TradmatchController],
  providers: [TradmatchService, CompanyOwnerGuard],
  exports: [TradmatchService],
})
export class TradmatchModule {}
