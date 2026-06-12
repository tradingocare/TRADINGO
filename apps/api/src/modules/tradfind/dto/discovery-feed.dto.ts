import { IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DiscoveryFeedDto {
  @ApiProperty({ description: 'Items per page', required: false, default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiProperty({ description: 'Page number', required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Latitude for personalized feed', required: false, example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for personalized feed', required: false, example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
