import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VendorCodesService } from './vendor-codes.service';
import { VendorCodesController } from './vendor-codes.controller';

@Module({
  imports: [PrismaModule],
  providers: [VendorCodesService],
  controllers: [VendorCodesController],
  exports: [VendorCodesService],
})
export class VendorCodesModule {}
