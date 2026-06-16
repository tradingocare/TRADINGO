import { Module } from '@nestjs/common';
import { TradgoController } from './tradgo.controller';
import { TradgoService } from './tradgo.service';

@Module({
  controllers: [TradgoController],
  providers: [TradgoService],
  exports: [TradgoService],
})
export class TradgoModule {}
