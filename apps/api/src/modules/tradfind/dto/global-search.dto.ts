import { IsString, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GlobalSearchDto {
  @ApiProperty({ description: 'Search query', example: 'mumbai traders' })
  @IsString()
  q: string;

  @ApiProperty({ description: 'Results per page', required: false, default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ description: 'Page number', required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Latitude for geo search', required: false, example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for geo search', required: false, example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Search radius in KM', required: false, example: 25, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radius?: number;
}
