import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CertificationType } from '@prisma/client';

export class CreateCertificationDto {
  @ApiProperty({ enum: CertificationType })
  @IsEnum(CertificationType)
  type: CertificationType;

  @ApiProperty()
  @IsString()
  documentUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  issuedBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
