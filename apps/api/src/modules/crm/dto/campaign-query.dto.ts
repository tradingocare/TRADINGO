import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrmCampaignType, CrmCampaignStatus } from '@prisma/client';

export class CampaignQueryDto {
  @IsOptional() @IsEnum(CrmCampaignType)
  @ApiPropertyOptional({ description: 'Filter by campaign type', enum: CrmCampaignType })
  type?: CrmCampaignType;

  @IsOptional() @IsEnum(CrmCampaignStatus)
  @ApiPropertyOptional({ description: 'Filter by status', enum: CrmCampaignStatus })
  status?: CrmCampaignStatus;

  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Search by name' })
  search?: string;

  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Items per page' })
  limit?: number;
}
