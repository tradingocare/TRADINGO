import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Latitude' })
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Longitude' })
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Search radius in kilometers' })
  radius?: number;
}

export class ClustersQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Entity type filter' })
  entityType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Time period' })
  period?: string;
}

export class ReverseGeocodeDto {
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Latitude' })
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Longitude' })
  lng: number;
}
