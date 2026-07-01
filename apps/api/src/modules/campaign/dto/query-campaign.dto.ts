import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { CampaignType, CampaignStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryCampaignDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(CampaignType) type?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) limit?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
  @IsOptional() @IsDateString() startDateFrom?: string;
  @IsOptional() @IsDateString() startDateTo?: string;
  @IsOptional() @IsDateString() endDateFrom?: string;
  @IsOptional() @IsDateString() endDateTo?: string;
  @IsOptional() @IsString() companyId?: string;
}
