import { IsString, MinLength, IsOptional, IsBoolean, IsInt, IsUUID, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiPropertyOptional({ description: 'Category name' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category icon' })
  icon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category image URL' })
  image?: string;

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
  @ApiPropertyOptional({ description: 'Whether the category is active' })
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}
