import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType, CampaignStatus } from '@prisma/client';
import { CreateCampaignRuleDto, CreateCampaignTargetDto } from './create-campaign.dto';

export class UpdateCampaignDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Campaign name' })
  name?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;
  @IsOptional() @IsEnum(CampaignType)
  @ApiPropertyOptional({ description: 'Campaign type', enum: CampaignType })
  type?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus)
  @ApiPropertyOptional({ description: 'Campaign status', enum: CampaignStatus })
  status?: CampaignStatus;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Campaign priority' })
  priority?: number;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  startDate?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  endDate?: string;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Campaign budget' })
  budget?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Maximum number of rewards' })
  maxRewards?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Daily claim limit' })
  dailyLimit?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Per-user claim limit' })
  perUserLimit?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Per-company claim limit' })
  perCompanyLimit?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Maximum total claims' })
  maxClaims?: number;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Reward amount' })
  rewardAmount?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Reward type' })
  rewardType?: string;
  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Eligibility criteria' })
  eligibility?: Record<string, unknown>;
  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Target audience configuration' })
  targetAudience?: Record<string, unknown>;
  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCampaignRuleDto)
  @ApiPropertyOptional({ description: 'Campaign rules', type: [CreateCampaignRuleDto] })
  rules?: CreateCampaignRuleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCampaignTargetDto)
  @ApiPropertyOptional({ description: 'Campaign targets', type: [CreateCampaignTargetDto] })
  targets?: CreateCampaignTargetDto[];
}
