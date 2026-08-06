import { IsString, IsOptional, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimCampaignDto {
  @IsString()
  @ApiProperty({ description: 'Campaign ID' })
  campaignId: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Claim type' })
  claimType?: string;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Claim amount' })
  amount?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string;
  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
