import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalAttributeType } from '@prisma/client';

export class CreateGlobalAttributeDto {
  @IsString()
  @ApiProperty({ description: 'Attribute name' })
  name: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Display label' })
  label?: string;
  @IsEnum(GlobalAttributeType)
  @ApiProperty({ description: 'Attribute type', enum: GlobalAttributeType })
  type: GlobalAttributeType;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Unit of measurement' })
  unit?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Predefined options' })
  options?: string[];
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the attribute is active' })
  isActive?: boolean;
  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}

export class UpdateGlobalAttributeDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Attribute name' })
  name?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Display label' })
  label?: string;
  @IsOptional()
  @IsEnum(GlobalAttributeType)
  @ApiPropertyOptional({ description: 'Attribute type', enum: GlobalAttributeType })
  type?: GlobalAttributeType;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Unit of measurement' })
  unit?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Predefined options' })
  options?: string[];
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the attribute is active' })
  isActive?: boolean;
  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ description: 'Sort order' })
  sortOrder?: number;
}

export class QueryGlobalAttributeDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string;
  @IsOptional()
  @IsEnum(GlobalAttributeType)
  @ApiPropertyOptional({ description: 'Filter by type', enum: GlobalAttributeType })
  type?: GlobalAttributeType;
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
