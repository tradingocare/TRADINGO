import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';

export class ReviewVerificationDto {
  @IsEnum(VerificationStatus)
  @ApiProperty({ description: 'Review status', enum: VerificationStatus })
  status: VerificationStatus;

  @IsString()
  @ApiProperty({ description: 'Review notes' })
  notes: string;
}
