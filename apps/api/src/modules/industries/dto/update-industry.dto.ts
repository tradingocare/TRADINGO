import { IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIndustryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiPropertyOptional({ description: 'Industry name' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @ApiPropertyOptional({ description: 'URL slug' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Industry description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Industry icon' })
  icon?: string;
}
