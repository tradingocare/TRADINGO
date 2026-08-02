import { IsString, IsOptional, IsInt, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EnterpriseSearchDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  q: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Entity types to search' })
  entityTypes?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Brand country filter' })
  brandCountry?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Attribute type filter' })
  attributeType?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: number = 20;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Whether to use synonym expansion' })
  useSynonyms?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Whether to use AI enhancement' })
  useAi?: boolean = false;
}

export class AutocompleteDto {
  @IsString()
  @ApiProperty({ description: 'Autocomplete query' })
  q: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number = 10;
}

export class SearchSuggestionsDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum suggestions' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Entity type filter' })
  entityType?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: 'Recent searches limit' })
  recentLimit?: number = 5;
}

export class ReindexEnterpriseSearchDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Indices to reindex' })
  indices?: string[];
}

export class EnterpriseSearchAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Entity type filter' })
  entityType?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Days of data' })
  days?: number = 30;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number = 20;
}

export class EnterpriseSearchHealthDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Indices to check' })
  indices?: string[];
}
