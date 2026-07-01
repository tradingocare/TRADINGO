import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CrmLeadStatus, CrmPriority, CrmLeadSource } from '@prisma/client';

export class QueryLeadDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(CrmLeadStatus) status?: CrmLeadStatus;
  @IsOptional() @IsEnum(CrmPriority) priority?: CrmPriority;
  @IsOptional() @IsEnum(CrmLeadSource) source?: CrmLeadSource;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) limit?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
}
