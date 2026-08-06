import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiJobType } from '@prisma/client';

export class GenerateDescriptionDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Target audience' })
  targetAudience?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tone' })
  tone?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Key features' })
  keyFeatures?: string[];
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Specifications' })
  specifications?: string[];
}

export class GenerateSeoDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Target keyword' })
  targetKeyword?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Additional keywords' })
  additionalKeywords?: string[];
}

export class TranslateProductDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsString()
  @ApiProperty({ description: 'Target locale' })
  targetLocale: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Source locale' })
  sourceLocale?: string;
}

export class SuggestSpecsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;
}

export class SuggestImagesDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Existing images' })
  existingImages?: string[];
}

export class UpdateSeoDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Meta title' })
  metaTitle?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Meta description' })
  metaDescription?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Focus keywords' })
  focusKeywords?: string[];
}

export class AcceptAiSuggestionDto {
  @IsString()
  @ApiProperty({ description: 'Cache ID' })
  cacheId: string;
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Edits' })
  edits?: Record<string, unknown>;
}

export class BulkEnhancementDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Product IDs' })
  productIds: string[];
  @IsArray()
  @IsEnum(AiJobType)
  @ApiProperty({ description: 'Job types', enum: AiJobType, isArray: true })
  jobTypes: AiJobType[];
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Options' })
  options?: Record<string, unknown>;
}

export class QueryCatalogQualityDto {
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Minimum score' })
  minScore?: number;
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Maximum score' })
  maxScore?: number;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: number;
}

export class DetectDuplicatesDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
}

export class AiHealthDashboardDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string;
}

export class GenerateTitleDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Style' })
  style?: string;
}

export class SuggestAttributesDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
}

export class SuggestCategoryDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
}

// P-3.3 New DTOs
export class GenerateHighlightsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
}

export class GenerateTagsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(20)
  @ApiPropertyOptional({ description: 'Tag count (3-20)' })
  count?: number;
}

export class SuggestHsnGstDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
}

export class SuggestRelatedProductsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @ApiPropertyOptional({ description: 'Number of related products (1-20)' })
  limit?: number;
}

export class GenerateMetaKeywordsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string;
}

export class GenerateBulkQualityScoresDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Product IDs' })
  productIds: string[];
}
