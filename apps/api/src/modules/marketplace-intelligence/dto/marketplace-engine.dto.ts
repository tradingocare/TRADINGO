import { IsOptional, IsString, IsNumber, Min, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UnifiedScoreQueryDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class NearFarQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  @ApiProperty({ description: 'Origin latitude' })
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  @ApiProperty({ description: 'Origin longitude' })
  lng: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Buyer ID' })
  buyerId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number;
}

export class SellerRecommendationsQueryDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number;
}

export class BuyerRecommendationsQueryDto {
  @IsString()
  @ApiProperty({ description: 'Buyer ID' })
  buyerId: string;

  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number;
}

export class RelationshipQueryDto {
  @IsString()
  @ApiProperty({ description: 'Buyer ID' })
  buyerId: string;

  @IsString()
  @ApiProperty({ description: 'Seller ID' })
  sellerId: string;
}

export class DeliveryPredictionDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  @ApiProperty({ description: 'Origin latitude' })
  originLat: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  @ApiProperty({ description: 'Origin longitude' })
  originLng: number;

  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  @ApiProperty({ description: 'Destination latitude' })
  destLat: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  @ApiProperty({ description: 'Destination longitude' })
  destLng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Weight in kilograms' })
  weightKg?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Courier name' })
  courier?: string;
}

export class BusinessIntelligenceQueryDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}
