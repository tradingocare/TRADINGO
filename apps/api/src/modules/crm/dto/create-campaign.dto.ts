import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrmCampaignType, CrmCampaignStatus } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;

  @IsOptional() @IsEnum(CrmCampaignType)
  @ApiPropertyOptional({ description: 'Campaign type', enum: CrmCampaignType })
  type?: CrmCampaignType;

  @IsOptional() @IsEnum(CrmCampaignStatus)
  @ApiPropertyOptional({ description: 'Campaign status', enum: CrmCampaignStatus })
  status?: CrmCampaignStatus;

  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Campaign start date' })
  startDate?: string;

  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Campaign end date' })
  endDate?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Campaign budget' })
  budget?: number;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Target number of leads' })
  targetLeads?: number;

  @IsOptional() @IsObject()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
