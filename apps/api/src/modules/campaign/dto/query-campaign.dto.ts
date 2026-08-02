import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType, CampaignStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryCampaignDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsEnum(CampaignType)
  @ApiPropertyOptional({ description: 'Filter by campaign type', enum: CampaignType })
  type?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: CampaignStatus })
  status?: CampaignStatus;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Sort field' })
  sortBy?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Sort order (asc or desc)' })
  sortOrder?: 'asc' | 'desc';
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date from' })
  startDateFrom?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date to' })
  startDateTo?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date from' })
  endDateFrom?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date to' })
  endDateTo?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
}
