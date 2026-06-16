import { Module } from '@nestjs/common';
import { NearMeController } from './near-me.controller';
import { NearMeService } from './near-me.service';

@Module({
  controllers: [NearMeController],
  providers: [NearMeService],
  exports: [NearMeService],
})
export class NearMeModule {}
