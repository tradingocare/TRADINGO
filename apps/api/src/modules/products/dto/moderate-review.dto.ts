import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModerateReviewDto {
  @IsIn(['APPROVED', 'REJECTED'], {
    message: 'status must be APPROVED or REJECTED — only PENDING reviews can be moderated',
  })
  @ApiProperty({ description: 'Moderation decision', enum: ['APPROVED', 'REJECTED'] })
  status: 'APPROVED' | 'REJECTED';
}
