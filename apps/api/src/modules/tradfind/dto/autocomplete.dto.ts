import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AutocompleteDto {
  @ApiProperty({ description: 'Search prefix', example: 'mumb' })
  @IsString()
  q: string;

  @ApiProperty({ description: 'Max suggestions', required: false, default: 10, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 10;

  @ApiProperty({ description: 'Latitude for geo-biased autocomplete', required: false, example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ description: 'Longitude for geo-biased autocomplete', required: false, example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
}
