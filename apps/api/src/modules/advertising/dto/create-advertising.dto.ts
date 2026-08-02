import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType, AdPricingModel, AdTargetType } from '@prisma/client';

export class CreateAdTargetDto {
  @IsEnum(AdTargetType)
  @ApiProperty({ description: 'Target type', enum: AdTargetType })
  targetType: AdTargetType;

  @IsString()
  @ApiProperty({ description: 'Target value' })
  targetValue: string;
}

export class CreateAdvertisingDto {
  @IsEnum(AdType)
  @ApiProperty({ description: 'Ad type', enum: AdType })
  type: AdType;

  @IsEnum(AdPricingModel)
  @ApiProperty({ description: 'Pricing model', enum: AdPricingModel })
  pricingModel: AdPricingModel;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Ad title' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Ad description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Image URL' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Target URL' })
  targetUrl?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ description: 'Daily budget' })
  dailyBudget: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ description: 'Total budget' })
  totalBudget: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Cost per click' })
  cpc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Cost per thousand impressions' })
  cpm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Fixed price' })
  fixedPrice?: number;

  @IsDateString()
  @ApiProperty({ description: 'Start date (ISO 8601)' })
  startDate: string;

  @IsDateString()
  @ApiProperty({ description: 'End date (ISO 8601)' })
  endDate: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto pause when budget exhausted' })
  autoPause?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto resume when budget replenished' })
  autoResume?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto stop on end date' })
  autoStop?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Keyword' })
  keyword?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City targeting' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand ID' })
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Priority' })
  priority?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdTargetDto)
  @ApiPropertyOptional({ description: 'Ad targets', type: [CreateAdTargetDto] })
  targets?: CreateAdTargetDto[];

  @IsOptional()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
