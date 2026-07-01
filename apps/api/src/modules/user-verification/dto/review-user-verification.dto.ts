import { IsString, IsEnum } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class ReviewUserVerificationDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsString()
  notes: string;
}
