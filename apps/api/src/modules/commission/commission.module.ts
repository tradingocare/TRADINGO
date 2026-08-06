import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommissionService } from './commission.service';
import { CommissionEngineService } from './commission-engine.service';
import { CommissionController } from './commission.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionController],
  providers: [CommissionService, CommissionEngineService],
  exports: [CommissionService, CommissionEngineService],
})
export class CommissionModule {}
