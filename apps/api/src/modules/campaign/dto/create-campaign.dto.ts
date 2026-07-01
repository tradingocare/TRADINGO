import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType } from '@prisma/client';

export class CreateCampaignRuleDto {
  @IsNumber() @Min(0) priority: number;
  @IsString() conditionField: string;
  @IsString() conditionOperator: string;
  @IsObject() conditionValue: Record<string, unknown>;
  @IsString() actionType: string;
  @IsObject() actionValue: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateCampaignTargetDto {
  @IsString() targetType: string;
  @IsString() targetId: string;
  @IsOptional() @IsBoolean() isInclude?: boolean;
}

export class CreateCampaignDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(CampaignType) type: CampaignType;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() @Min(0) priority?: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
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
