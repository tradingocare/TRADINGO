import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CommunityVisibility } from '@prisma/client';

export class DiscoverCommunitiesDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID filter' })
  categoryId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search term' })
  search?: string;
  @IsOptional()
  @IsEnum(CommunityVisibility)
  @ApiPropertyOptional({ description: 'Visibility filter', enum: CommunityVisibility })
  visibility?: CommunityVisibility;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page number' })
  page?: number;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page limit' })
  limit?: number;
}
