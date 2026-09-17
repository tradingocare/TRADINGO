import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassifyCatalogDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({ description: 'Product or service name to classify' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ description: 'Description for richer classification signals' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ description: 'Brand, if known' })
  brand?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Attribute key/value signals', type: Object })
  attributes?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ description: 'Image URL (reserved for future vision classification)' })
  imageUrl?: string;

  @IsOptional()
  @IsIn(['product', 'service'])
  @ApiPropertyOptional({ description: 'Offer context hint; narrows the leaf search', enum: ['product', 'service'] })
  context?: 'product' | 'service';
}

export interface ClassifyAlternative {
  categoryId: string;
  subcategoryId: string | null;
  catalogItemId: string | null;
  label: string;
  confidence: number;
}

export interface ClassifyCatalogResponse {
  categoryId: string | null;
  subcategoryId: string | null;
  catalogItemId: string | null;
  /** Canonical leaf type. Null only when unclassified. */
  type: 'Product' | 'Service' | null;
  confidence: number;
  /** HIGH = auto-apply · MEDIUM = suggest + confirm · LOW = structured picker. */
  band: 'HIGH' | 'MEDIUM' | 'LOW';
  matchType: 'exact' | 'synonym' | 'ai' | 'fallback' | 'unclassified';
  reasons: string[];
  alternatives: ClassifyAlternative[];
  /** Display labels for the primary suggestion (names are display-only). */
  categoryName?: string | null;
  subcategoryName?: string | null;
}
