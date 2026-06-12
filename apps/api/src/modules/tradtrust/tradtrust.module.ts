import { Module } from '@nestjs/common';
import { TradTrustService } from './tradtrust.service';

@Module({
  providers: [TradTrustService],
  exports: [TradTrustService],
})
export class TradTrustModule {}
