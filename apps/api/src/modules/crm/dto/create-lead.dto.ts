import { IsString, IsOptional, IsEnum, IsNumber, IsEmail, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CrmLeadStatus, CrmPriority, CrmLeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional() @IsString() companyId?: string;
  @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsEnum(CrmLeadSource) source?: CrmLeadSource;
  @IsOptional() @IsEnum(CrmLeadStatus) status?: CrmLeadStatus;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @IsEnum(CrmPriority) priority?: CrmPriority;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) score?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) estimatedValue?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() metadata?: Record<string, unknown>;
}
