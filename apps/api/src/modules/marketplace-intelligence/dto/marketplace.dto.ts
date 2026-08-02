import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BestSupplierQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Buyer ID' })
  buyerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Latitude' })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Longitude' })
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Search radius' })
  radius?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number;
}

export class RecordEventDto {
  @IsString()
  @ApiProperty({ description: 'Buyer ID' })
  buyerId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Buyer company name' })
  buyerCompany?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product ID' })
  productId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Seller ID' })
  sellerId?: string;

  @IsString()
  @ApiProperty({ description: 'Event type' })
  eventType: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search query' })
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Rating' })
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ description: 'Amount' })
  amount?: number;
}
