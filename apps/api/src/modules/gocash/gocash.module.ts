import { Module } from '@nestjs/common';
import { GocashController } from './gocash.controller';
import { GocashService } from './gocash.service';

@Module({
  controllers: [GocashController],
  providers: [GocashService],
  exports: [GocashService],
})
export class GocashModule {}
