import { IsString, IsOptional, IsInt, Min, Max, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SearchSort } from '../enums/search.enums';

export class ProductSearchDto {
  @ApiProperty({ description: 'Search query', required: false, example: 'wireless earphones' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ description: 'Filter by category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Filter by industry ID', required: false })
  @IsOptional()
  @IsString()
  industryId?: string;

  @ApiProperty({ description: 'Filter by product type', required: false })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiProperty({ description: 'Filter by verification level', required: false })
  @IsOptional()
  @IsString()
  verificationLevel?: string;

  @ApiProperty({ description: 'Filter by business type', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ description: 'Filter by brand', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by state', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Search radius in KM', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radius?: number;

  @ApiProperty({ description: 'Latitude for geo search', required: false, example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for geo search', required: false, example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Minimum order quantity filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  moq?: number;

  @ApiProperty({ description: 'Minimum price filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price filter', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({ description: 'Minimum trust score (0-100)', required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minTrustScore?: number;

  @ApiProperty({ description: 'Results per page', required: false, default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiProperty({ description: 'Page number', required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Pagination cursor', required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: 'Sort order', required: false, enum: SearchSort })
  @IsOptional()
  @IsEnum(SearchSort)
  sort?: SearchSort;

  @ApiProperty({ description: 'Include faceted search aggregations', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeFacets?: boolean;

  @ApiProperty({ description: 'Filter by sub-category', required: false })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiProperty({ description: 'Minimum MOQ filter (alias of moq)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minMoq?: number;

  @ApiProperty({ description: 'Verified sellers only', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({ description: 'Top rated only (rating >= 4.5)', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  topRated?: boolean;

  @ApiProperty({ description: 'In stock / available only', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @ApiProperty({ description: 'Fast responding sellers only', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  fastResponse?: boolean;

  @ApiProperty({ description: 'Filter by seller type (manufacturer/wholesaler/distributor/service_provider)', required: false })
  @IsOptional()
  @IsString()
  sellerType?: string;

  @ApiProperty({ description: 'Latitude (alias of latitude)', required: false, example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({ description: 'Longitude (alias of longitude)', required: false, example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiProperty({ description: 'Search radius in KM (alias of radius)', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  kmRadius?: number;

  @ApiProperty({ description: 'Geo scope (pan_india | near_me)', required: false })
  @IsOptional()
  @IsString()
  geoScope?: string;
}
