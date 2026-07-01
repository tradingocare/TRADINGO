import { Module } from '@nestjs/common';
import { WalletApiController } from './wallet-api.controller';
import { WalletApiService } from './wallet-api.service';
import { GocashModule } from '../gocash/gocash.module';

@Module({
  imports: [GocashModule],
  controllers: [WalletApiController],
  providers: [WalletApiService],
  exports: [WalletApiService],
})
export class WalletApiModule {}
