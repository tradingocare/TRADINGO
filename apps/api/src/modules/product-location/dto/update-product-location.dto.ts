import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { GeographicReach } from '@prisma/client';

export class UpdateProductLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsEnum(GeographicReach)
  visibilityRadius?: GeographicReach;
}
