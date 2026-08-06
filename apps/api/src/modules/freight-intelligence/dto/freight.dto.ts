import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FreightEstimateDto {
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Origin latitude' })
  originLat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Origin longitude' })
  originLng: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Destination latitude' })
  destLat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Destination longitude' })
  destLng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50000)
  @ApiPropertyOptional({ description: 'Weight (0.1-50000)' })
  weight?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Weight unit' })
  weightUnit?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shipment type' })
  shipmentType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Number of packages' })
  packages?: number;
}

export class CarrierMatchDto {
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Origin latitude' })
  originLat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Origin longitude' })
  originLng: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Destination latitude' })
  destLat: number;

  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Destination longitude' })
  destLng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @ApiPropertyOptional({ description: 'Weight' })
  weight?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shipment type' })
  shipmentType?: string;

  @IsString()
  @ApiProperty({ description: 'Origin pincode' })
  originPin: string;

  @IsString()
  @ApiProperty({ description: 'Destination pincode' })
  destPin: string;
}

export class FreightAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Time period' })
  period?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number;
}
