import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrmLeadStatus, CrmPriority, CrmLeadSource } from '@prisma/client';

export class QueryLeadDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  search?: string;
  @IsOptional() @IsEnum(CrmLeadStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: CrmLeadStatus })
  status?: CrmLeadStatus;
  @IsOptional() @IsEnum(CrmPriority)
  @ApiPropertyOptional({ description: 'Filter by priority', enum: CrmPriority })
  priority?: CrmPriority;
  @IsOptional() @IsEnum(CrmLeadSource)
  @ApiPropertyOptional({ description: 'Filter by source', enum: CrmLeadSource })
  source?: CrmLeadSource;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Owner user ID' })
  ownerId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Pipeline stage ID' })
  stageId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Sort field' })
  sortBy?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Sort order (asc or desc)' })
  sortOrder?: 'asc' | 'desc';
}
