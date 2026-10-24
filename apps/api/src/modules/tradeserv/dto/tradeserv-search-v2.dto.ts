import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalType } from '@prisma/client';

export class TradeservSearchV2Dto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;

  // C-01 P1 F-8: canonical taxonomy filters (Step-5 contract). Server-side
  // validated against the live catalog (existence + parent/child chain +
  // Service type) and resolved to the exact set of APPROVED professional
  // company IDs. Invalid IDs / mismatched parent-child combinations resolve
  // to an honest empty result — never unfiltered, never fabricated.
  @ApiPropertyOptional({ description: 'Canonical CatalogCategory ID' })
  @IsOptional() @IsString() catalogCategoryId?: string;

  @ApiPropertyOptional({ description: 'Canonical CatalogSubcategory ID' })
  @IsOptional() @IsString() catalogSubcategoryId?: string;

  @ApiPropertyOptional({ description: 'Canonical CatalogItem ID (Service leaf)' })
  @IsOptional() @IsString() catalogItemId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;

  @ApiPropertyOptional() @IsOptional() @IsEnum(ProfessionalType) professionalType?: ProfessionalType;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(5) minRating?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(5) maxRating?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() verificationLevel?: string;

  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() sort?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(50) limit?: number = 20;
}

export class TradeservSearchV2Response {
  data: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  aggregations: {
    categories: { key: string; doc_count: number }[];
    // C-01 P1 F-8: canonical taxonomy facets (IDs + display). Options come
    // from real indexed professional docs — never static lists.
    catalogCategories: { key: string; doc_count: number; name?: string; slug?: string; parentId?: string }[];
    catalogSubcategories: { key: string; doc_count: number; name?: string; slug?: string; parentId?: string }[];
    catalogItems: { key: string; doc_count: number; name?: string; slug?: string; parentId?: string }[];
    cities: { key: string; doc_count: number }[];
    states: { key: string; doc_count: number }[];
    verificationLevels: { key: string; doc_count: number }[];
    ratingRanges: { key: string; from?: number; to?: number; doc_count: number }[];
    professionalTypes: { key: string; doc_count: number }[];
  };
}