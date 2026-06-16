import { Module } from '@nestjs/common';
import { ProfileCompletionController } from './profile-completion.controller';
import { ProfileCompletionService } from './profile-completion.service';

@Module({
  controllers: [ProfileCompletionController],
  providers: [ProfileCompletionService],
  exports: [ProfileCompletionService],
})
export class ProfileCompletionModule {}
