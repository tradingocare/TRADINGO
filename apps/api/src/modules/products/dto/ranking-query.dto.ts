import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TrendingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum results (1-100)' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City filter' })
  city?: string;
}

export class TopCategoriesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum results (1-100)' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City filter' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'State filter' })
  state?: string;
}

export class TopSellersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum results (1-100)' })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City filter' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'State filter' })
  state?: string;
}

export class NearMeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: 'Maximum results (1-100)' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Radius in kilometers' })
  radiusKm?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'City filter' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'State filter' })
  state?: string;
}
