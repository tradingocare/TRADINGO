import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdType, AdPricingModel } from '@prisma/client';
import { CreateAdTargetDto } from './create-advertising.dto';

export class UpdateAdvertisingDto {
  @IsOptional() @IsEnum(AdType)
  @ApiPropertyOptional({ description: 'Ad type', enum: AdType })
  type?: AdType;
  @IsOptional() @IsEnum(AdPricingModel)
  @ApiPropertyOptional({ description: 'Pricing model', enum: AdPricingModel })
  pricingModel?: AdPricingModel;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Ad title' })
  title?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Ad description' })
  description?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Image URL' })
  imageUrl?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Target URL' })
  targetUrl?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Daily budget' })
  dailyBudget?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Total budget' })
  totalBudget?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Cost per click' })
  cpc?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Cost per thousand impressions' })
  cpm?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  @ApiPropertyOptional({ description: 'Fixed price' })
  fixedPrice?: number;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  startDate?: string;
  @IsOptional() @IsDateString()
  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  endDate?: string;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto pause when budget exhausted' })
  autoPause?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto resume when budget replenished' })
  autoResume?: boolean;
  @IsOptional() @IsBoolean()
  @ApiPropertyOptional({ description: 'Auto stop on end date' })
  autoStop?: boolean;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Keyword' })
  keyword?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'City targeting' })
  city?: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Brand ID' })
  brandId?: string;
  @IsOptional() @IsNumber() @Type(() => Number)
  @ApiPropertyOptional({ description: 'Priority' })
  priority?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateAdTargetDto)
  @ApiPropertyOptional({ description: 'Ad targets', type: [CreateAdTargetDto] })
  targets?: CreateAdTargetDto[];
  @IsOptional()
  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
