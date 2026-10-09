import { IsOptional, IsString } from 'class-validator';

export class CardPreviewQueryDto {
  // Comma-separated catalog subcategory IDs (established project convention,
  // same as resolve/old-to-new and unified-search/bulk). Bounded server-side.
  @IsOptional()
  @IsString()
  catalogSubcategoryIds?: string;
}

export class CardSubcategoryPreview {
  subcategoryId: string;
  products: Record<string, unknown>[];
  productTotal: number;
  services: Record<string, unknown>[];
  status: 'ok' | 'error';
}

export class CardPreviewResponse {
  previews: CardSubcategoryPreview[];
}
