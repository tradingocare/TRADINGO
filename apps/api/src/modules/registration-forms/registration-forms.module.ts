import { Module } from '@nestjs/common';
import { RegistrationFormsController } from './registration-forms.controller';
import { RegistrationFormsService } from './registration-forms.service';
import { AuthModule } from '../auth/auth.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [AuthModule, MembershipModule],
  controllers: [RegistrationFormsController],
  providers: [RegistrationFormsService],
  exports: [RegistrationFormsService],
})
export class RegistrationFormsModule {}
