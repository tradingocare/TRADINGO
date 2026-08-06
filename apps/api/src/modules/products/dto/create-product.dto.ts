import { IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsArray, ValidateNested, IsNumber, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductType, ProductStatus, MediaType, VariantType, GeographicReach } from '@prisma/client';

class ProductMediaDto {
  @IsEnum(MediaType)
  @ApiProperty({ description: 'Media type', enum: MediaType })
  type: MediaType;

  @IsString()
  @ApiProperty({ description: 'Media URL' })
  url: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Media title' })
  title?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}

class ProductSpecificationDto {
  @IsString()
  @ApiProperty({ description: 'Specification key' })
  key: string;

  @IsString()
  @ApiProperty({ description: 'Specification value' })
  value: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}

class ProductVariantDto {
  @IsEnum(VariantType)
  @ApiProperty({ description: 'Variant type', enum: VariantType })
  variantType: VariantType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Custom variant name' })
  customName?: string;

  @IsString()
  @ApiProperty({ description: 'Variant value' })
  value: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Variant SKU' })
  sku?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Variant price' })
  price?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Compare at price' })
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Currency' })
  currency?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Available quantity' })
  availableQuantity?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Minimum threshold' })
  minimumThreshold?: number;
}

class ProductPriceSlabDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Minimum quantity' })
  minQty: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum quantity' })
  maxQty?: number;

  @IsNumber()
  @ApiProperty({ description: 'Price per unit' })
  price: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Currency' })
  currency?: string;
}

export class CreateProductDto {
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ description: 'Product name' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Short description' })
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Full description' })
  description?: string;

  @IsOptional()
  @IsEnum(ProductType)
  @ApiPropertyOptional({ description: 'Product type', enum: ProductType })
  productType?: ProductType;

  @IsOptional()
  @IsEnum(ProductStatus)
  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus })
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand name' })
  brand?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Model name' })
  model?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SKU' })
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  moq?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Unit of measurement' })
  unit?: string;

  @IsOptional()
  @IsEnum(GeographicReach)
  @ApiPropertyOptional({ description: 'Visibility radius', enum: GeographicReach })
  visibilityRadius?: GeographicReach;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether product is featured' })
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Latitude' })
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Longitude' })
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  @ApiPropertyOptional({ description: 'Product media', type: [ProductMediaDto] })
  media?: ProductMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  @ApiPropertyOptional({ description: 'Product specifications', type: [ProductSpecificationDto] })
  specifications?: ProductSpecificationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @ApiPropertyOptional({ description: 'Product variants', type: [ProductVariantDto] })
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'Available quantity' })
  availableQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'Minimum threshold' })
  minimumThreshold?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceSlabDto)
  @ApiPropertyOptional({ description: 'Price slabs', type: [ProductPriceSlabDto] })
  priceSlabs?: ProductPriceSlabDto[];
}
