import { IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandVerificationStatus } from '@prisma/client';

export class CreateGlobalBrandDto {
  @IsString()
  @ApiProperty({ description: 'Brand name' })
  name: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Brand aliases' })
  aliases?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Manufacturer name' })
  manufacturer?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Country of origin' })
  country?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand logo URL' })
  logo?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand website' })
  website?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand description' })
  description?: string;
  @IsOptional()
  @IsEnum(BrandVerificationStatus)
  @ApiPropertyOptional({ description: 'Verification status', enum: BrandVerificationStatus })
  verificationStatus?: BrandVerificationStatus;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SEO title' })
  seoTitle?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SEO description' })
  seoDescription?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the brand is active' })
  isActive?: boolean;
}

export class UpdateGlobalBrandDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand name' })
  name?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Brand aliases' })
  aliases?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Manufacturer name' })
  manufacturer?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Country of origin' })
  country?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand logo URL' })
  logo?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand website' })
  website?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand description' })
  description?: string;
  @IsOptional()
  @IsEnum(BrandVerificationStatus)
  @ApiPropertyOptional({ description: 'Verification status', enum: BrandVerificationStatus })
  verificationStatus?: BrandVerificationStatus;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SEO title' })
  seoTitle?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SEO description' })
  seoDescription?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the brand is active' })
  isActive?: boolean;
}

export class QueryGlobalBrandDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string;
  @IsOptional()
  @IsEnum(BrandVerificationStatus)
  @ApiPropertyOptional({ description: 'Filter by verification status', enum: BrandVerificationStatus })
  verificationStatus?: BrandVerificationStatus;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Filter by active status' })
  isActive?: boolean;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Pagination cursor' })
  cursor?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: string;
}
