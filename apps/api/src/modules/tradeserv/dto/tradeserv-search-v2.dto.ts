import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfessionalType } from '@prisma/client';

export class TradeservSearchV2Dto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;

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
    cities: { key: string; doc_count: number }[];
    states: { key: string; doc_count: number }[];
    verificationLevels: { key: string; doc_count: number }[];
    ratingRanges: { key: string; from?: number; to?: number; doc_count: number }[];
    professionalTypes: { key: string; doc_count: number }[];
  };
}