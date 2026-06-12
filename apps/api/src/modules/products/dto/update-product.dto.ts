import { IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsArray, ValidateNested, IsNumber, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, ProductStatus, MediaType, VariantType, GeographicReach } from '@prisma/client';

class ProductMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ProductSpecificationDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ProductVariantDto {
  @IsEnum(VariantType)
  variantType: VariantType;

  @IsOptional()
  @IsString()
  customName?: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  availableQuantity?: number;

  @IsOptional()
  @IsInt()
  minimumThreshold?: number;
}

class ProductPriceSlabDto {
  @IsInt()
  @Min(1)
  minQty: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQty?: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  industryId?: string | null;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  moq?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(GeographicReach)
  visibilityRadius?: GeographicReach;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  media?: ProductMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  availableQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumThreshold?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceSlabDto)
  priceSlabs?: ProductPriceSlabDto[];
}
