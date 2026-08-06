import { Module } from '@nestjs/common';
import { RefundEngineService } from './refund-engine.service';
import { RefundEngineController } from './refund-engine.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [RefundEngineController],
  providers: [RefundEngineService],
  exports: [RefundEngineService],
})
export class RefundModule {}
