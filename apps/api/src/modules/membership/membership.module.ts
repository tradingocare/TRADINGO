import { Module, forwardRef } from '@nestjs/common';
import { MembershipController } from './membership.controller';
import { MembershipAdminController } from './membership-admin.controller';
import { MembershipService } from './membership.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [forwardRef(() => BillingModule)],
  controllers: [MembershipController, MembershipAdminController],
  providers: [MembershipService, PrismaService],
  exports: [MembershipService],
})
export class MembershipModule {}
