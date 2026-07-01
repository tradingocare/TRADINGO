import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min } from 'class-validator';
import { ReferralCodeType } from '@prisma/client';

export class CreateReferralCodeDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsEnum(ReferralCodeType)
  type: ReferralCodeType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rewardAmount?: number;

  @IsOptional()
  @IsString()
  rewardType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsage?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ApplyReferralDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsUUID()
  refereeUserId?: string;

  @IsOptional()
  @IsString()
  refereeEmail?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class ValidateReferralDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  refereeEmail?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class AddToBlacklistDto {
  @IsString()
  type: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SearchQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}
