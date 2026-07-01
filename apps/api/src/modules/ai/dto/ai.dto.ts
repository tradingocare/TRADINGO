import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNumber } from 'class-validator';
import { AiJobType } from '@prisma/client';

export class GenerateDescriptionDto {
  @IsString() productId: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsString() tone?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) keyFeatures?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) specifications?: string[];
}

export class GenerateSeoDto {
  @IsString() productId: string;
  @IsOptional() @IsString() targetKeyword?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) additionalKeywords?: string[];
}

export class TranslateProductDto {
  @IsString() productId: string;
  @IsString() targetLocale: string;
  @IsOptional() @IsString() sourceLocale?: string;
}

export class SuggestSpecsDto {
  @IsString() productId: string;
  @IsOptional() @IsString() categoryId?: string;
}

export class SuggestImagesDto {
  @IsString() productId: string;
  @IsOptional() @IsArray() @IsString({ each: true }) existingImages?: string[];
}

export class UpdateSeoDto {
  @IsOptional() @IsString() metaTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) focusKeywords?: string[];
}

export class AcceptAiSuggestionDto {
  @IsString() cacheId: string;
  @IsOptional() @IsObject() edits?: Record<string, any>;
}

export class BulkEnhancementDto {
  @IsArray() @IsString({ each: true }) productIds: string[];
  @IsArray() @IsEnum(AiJobType) jobTypes: AiJobType[];
  @IsOptional() @IsObject() options?: Record<string, any>;
}

export class QueryCatalogQualityDto {
  @IsOptional() @IsNumber() minScore?: number;
  @IsOptional() @IsNumber() maxScore?: number;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() limit?: number;
}

export class DetectDuplicatesDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() companyId?: string;
}

export class AiHealthDashboardDto {
  @IsOptional() @IsString() companyId?: string;
}
