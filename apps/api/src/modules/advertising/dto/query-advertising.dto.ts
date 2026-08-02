import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdType, AdStatus } from '@prisma/client';

export class QueryAdvertisingDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;

  @IsOptional()
  @IsEnum(AdType)
  @ApiPropertyOptional({ description: 'Filter by ad type', enum: AdType })
  type?: AdType;

  @IsOptional()
  @IsEnum(AdStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: AdStatus })
  status?: AdStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort field' })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort order (asc or desc)' })
  sortOrder?: 'asc' | 'desc';
}
