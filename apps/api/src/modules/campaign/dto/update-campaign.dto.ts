import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType, CampaignStatus } from '@prisma/client';
import { CreateCampaignRuleDto, CreateCampaignTargetDto } from './create-campaign.dto';

export class UpdateCampaignDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(CampaignType) type?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
  @IsOptional() @IsNumber() @Min(0) priority?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() @Min(0) budget?: number;
  @IsOptional() @IsNumber() @Min(0) maxRewards?: number;
  @IsOptional() @IsNumber() @Min(0) dailyLimit?: number;
  @IsOptional() @IsNumber() @Min(0) perUserLimit?: number;
  @IsOptional() @IsNumber() @Min(0) perCompanyLimit?: number;
  @IsOptional() @IsNumber() @Min(0) maxClaims?: number;
  @IsOptional() @IsNumber() @Min(0) rewardAmount?: number;
  @IsOptional() @IsString() rewardType?: string;
  @IsOptional() @IsObject() eligibility?: Record<string, unknown>;
  @IsOptional() @IsObject() targetAudience?: Record<string, unknown>;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCampaignRuleDto) rules?: CreateCampaignRuleDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCampaignTargetDto) targets?: CreateCampaignTargetDto[];
}
