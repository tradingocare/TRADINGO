import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType } from '@prisma/client';

export class CreateCampaignRuleDto {
  @IsNumber() @Min(0)
  @ApiProperty({ description: 'Rule priority' })
  priority: number;
  @IsString()
  @ApiProperty({ description: 'Condition field name' })
  conditionField: string;
  @IsString()
  @ApiProperty({ description: 'Condition operator' })
  conditionOperator: string;
  @IsObject()
  @ApiProperty({ description: 'Condition value' })
  conditionValue: Record<string, unknown>;
  @IsString()
  @ApiProperty({ description: 'Action type' })
  actionType: string;
  @IsObject()
  @ApiProperty({ description: 'Action value' })
  actionValue: Record<string, unknown>;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  isActive?: boolean;
}

export class CreateCampaignTargetDto {
  @IsString()
  @ApiProperty({ description: 'Target type' })
  targetType: string;
  @IsString()
  @ApiProperty({ description: 'Target ID' })
  targetId: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether to include or exclude' })
  isInclude?: boolean;
}

export class CreateCampaignDto {
  @IsString()
  @ApiProperty({ description: 'Campaign name' })
  name: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;
  @IsEnum(CampaignType)
  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  type: CampaignType;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Campaign status' })
  status?: string;
  @IsOptional() @IsNumber() @Min(0)
  @ApiPropertyOptional({ description: 'Campaign priority' })
  priority?: number;
  @IsDateString()
  @ApiProperty({ description: 'Start date (ISO 8601)' })
  startDate: string;
  @IsDateString()
  @ApiProperty({ description: 'End date (ISO 8601)' })
  endDate: string;
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
