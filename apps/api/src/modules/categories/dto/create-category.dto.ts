import { IsString, MinLength, IsOptional, IsBoolean, IsInt, Matches, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({ description: 'Category name' })
  name: string;

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
