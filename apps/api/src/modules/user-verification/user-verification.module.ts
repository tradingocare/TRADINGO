import { Module } from '@nestjs/common';
import { UserVerificationController } from './user-verification.controller';
import { UserVerificationService } from './user-verification.service';

@Module({
  controllers: [UserVerificationController],
  providers: [UserVerificationService],
  exports: [UserVerificationService],
})
export class UserVerificationModule {}
