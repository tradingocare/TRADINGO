import { Module } from '@nestjs/common';
import { UserVerificationController } from './user-verification.controller';
import { UserVerificationService } from './user-verification.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [UserVerificationController],
  providers: [UserVerificationService],
  exports: [UserVerificationService],
})
export class UserVerificationModule {}
