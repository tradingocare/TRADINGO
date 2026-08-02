import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class ResolveMappingResult {
  @IsString()
  sourceId: string;

  @IsString()
  sourceType: 'oldCategory' | 'catalogCategory' | 'catalogSubcategory' | 'catalogItem';

  @IsString()
  sourceName: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetName?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsString()
  matchType?: 'exact' | 'fuzzy' | 'none';
}

export class UnifiedSearchItem {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: 'oldCategory' | 'catalogCategory' | 'catalogSubcategory' | 'catalogItem';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class CatalogTreeNode {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  sortOrder: number;

  @IsArray()
  subcategories: CatalogTreeSubcategoryNode[];
}

export class CatalogTreeSubcategoryNode {
  @IsString()
  id: string;

  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  itemCount?: number;
}

export class ResolveBatchResult {
  resolved: ResolveMappingResult[];
  unresolved: { id: string; name?: string }[];
  totalInput: number;
  resolvedCount: number;
  unresolvedCount: number;
}
