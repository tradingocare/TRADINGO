import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogSynonymDto {
  @IsString()
  @ApiProperty({ description: 'Search term' })
  term: string;
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Synonym terms' })
  synonyms: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Locale' })
  locale?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the synonym is active' })
  isActive?: boolean;
}

export class UpdateCatalogSynonymDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term' })
  term?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Synonym terms' })
  synonyms?: string[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Locale' })
  locale?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the synonym is active' })
  isActive?: boolean;
}

export class CreateIndustryCategoryMappingDto {
  @IsString()
  @ApiProperty({ description: 'Industry ID' })
  industryId: string;
  @IsString()
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mapping description' })
  description?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the mapping is active' })
  isActive?: boolean;
}

export class UpdateIndustryCategoryMappingDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mapping description' })
  description?: string;
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the mapping is active' })
  isActive?: boolean;
}
