import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdType, AdPricingModel, AdTargetType } from '@prisma/client';

export class CreateAdTargetDto {
  @IsEnum(AdTargetType)
  targetType: AdTargetType;

  @IsString()
  targetValue: string;
}

export class CreateAdvertisingDto {
  @IsEnum(AdType)
  type: AdType;

  @IsEnum(AdPricingModel)
  pricingModel: AdPricingModel;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dailyBudget: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalBudget: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cpc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cpm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedPrice?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  autoPause?: boolean;

  @IsOptional()
  @IsBoolean()
  autoResume?: boolean;

  @IsOptional()
  @IsBoolean()
  autoStop?: boolean;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priority?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdTargetDto)
  targets?: CreateAdTargetDto[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}
