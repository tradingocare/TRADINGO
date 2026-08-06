import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralCodeType } from '@prisma/client';

export class CreateReferralCodeDto {
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;

  @IsEnum(ReferralCodeType)
  @ApiProperty({ description: 'Referral code type', enum: ReferralCodeType })
  type: ReferralCodeType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ApiPropertyOptional({ description: 'Reward amount' })
  rewardAmount?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reward type' })
  rewardType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum usage count' })
  maxUsage?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  expiresAt?: string;
}

export class ApplyReferralDto {
  @IsString()
  @ApiProperty({ description: 'Referral code' })
  code: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Referee user ID' })
  refereeUserId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Referee email' })
  refereeEmail?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Device ID' })
  deviceId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Source' })
  source?: string;
}

export class ValidateReferralDto {
  @IsString()
  @ApiProperty({ description: 'Referral code' })
  code: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Referee email' })
  refereeEmail?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Device ID' })
  deviceId?: string;
}

export class AddToBlacklistDto {
  @IsString()
  @ApiProperty({ description: 'Blacklist type' })
  type: string;

  @IsString()
  @ApiProperty({ description: 'Value to blacklist' })
  value: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Blacklist reason' })
  reason?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  expiresAt?: string;
}

export class SearchQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
}
