import { IsString, IsOptional, IsEnum, IsNumber, IsEmail, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrmLeadStatus, CrmPriority, CrmLeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsString()
  @ApiProperty({ description: 'Lead name' })
  name: string;
  @IsOptional() @IsEmail()
  @ApiPropertyOptional({ description: 'Lead email' })
  email?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Lead mobile number' })
  mobile?: string;
  @IsOptional() @IsEnum(CrmLeadSource)
  @ApiPropertyOptional({ description: 'Lead source', enum: CrmLeadSource })
  source?: CrmLeadSource;
  @IsOptional() @IsEnum(CrmLeadStatus)
  @ApiPropertyOptional({ description: 'Lead status', enum: CrmLeadStatus })
  status?: CrmLeadStatus;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Pipeline stage ID' })
  stageId?: string;
  @IsOptional() @IsEnum(CrmPriority)
  @ApiPropertyOptional({ description: 'Lead priority', enum: CrmPriority })
  priority?: CrmPriority;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Owner user ID' })
  ownerId?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Lead score' })
  score?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Estimated deal value' })
  estimatedValue?: number;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Lead description' })
  description?: string;
  @IsOptional()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
