import { IsNumber, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export interface CategoryDemandScore {
  categoryId: string;
  categoryName: string;
  slug: string;
  icon: string | null;
  rank: number;
  totalDemandScore: number;
  dataConfidence: number; // 0.0 - 1.0
  signalBreakdown: {
    sales: number; // 0-100 percentile
    rfq: number; // 0-100 percentile
    search: number; // 0-100 percentile
    views: number; // 0-100 percentile
    engagement: number; // 0-100 percentile
    conversion: number; // 0-100 percentile
  };
  calculatedAt: Date;
}

export class CategoryDemandResult {
  data: CategoryDemandScore[];
  meta: {
    total: number;
    limit: number;
  };
}

export interface CategorySignalBreakdown {
  sales: number;
  rfq: number;
  search: number;
  views: number;
  engagement: number;
  conversion: number;
}

export class TopCategoriesParams {
  /** Number of top categories to return (max 50, default 20) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}