import { IsArray, IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { GeographicReach } from '@prisma/client';

export class BulkUpdateLocationDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsEnum(GeographicReach)
  visibilityRadius?: GeographicReach;
}
