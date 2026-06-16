import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min, IsNumber, IsDateString } from 'class-validator';
import { RfqType, RfqVisibility, RfqUrgency, RfqStatus } from '@prisma/client';

export class UpdateRfqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RfqType })
  @IsOptional()
  @IsEnum(RfqType)
  rfqType?: RfqType;

  @ApiPropertyOptional({ enum: RfqVisibility })
  @IsOptional()
  @IsEnum(RfqVisibility)
  visibility?: RfqVisibility;

  @ApiPropertyOptional({ enum: RfqUrgency })
  @IsOptional()
  @IsEnum(RfqUrgency)
  urgency?: RfqUrgency;

  @ApiPropertyOptional({ enum: RfqStatus })
  @IsOptional()
  @IsEnum(RfqStatus)
  status?: RfqStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBudget?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industryId?: string;
}
