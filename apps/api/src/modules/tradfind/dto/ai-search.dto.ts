import { IsString, IsOptional, IsObject, IsArray, IsNumber, Min } from 'class-validator'

export class AiSemanticSearchDto {
  @IsString()
  query: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  industry?: string

  @IsString()
  @IsOptional()
  userId?: string
}

export class AiSearchIntentDto {
  @IsString()
  query: string
}

export class AiSimilarProductsDto {
  @IsString()
  productId: string

  @IsString()
  @IsOptional()
  productName?: string

  @IsString()
  @IsOptional()
  categoryId?: string

  @IsString()
  @IsOptional()
  industryId?: string

  @IsString()
  @IsOptional()
  productType?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number
}

export class AiSimilarSuppliersDto {
  @IsString()
  companyId: string

  @IsString()
  @IsOptional()
  companyName?: string

  @IsString()
  @IsOptional()
  businessType?: string

  @IsString()
  @IsOptional()
  industryId?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number
}

export class AiPersonalizedRankingDto {
  @IsArray()
  results: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  userContext?: {
    industryId?: string
    recentClicks?: string[]
    recentOrders?: string[]
    recentRfqs?: string[]
    savedProducts?: string[]
  }

  @IsString()
  @IsOptional()
  query?: string

  @IsString()
  @IsOptional()
  sortBy?: string
}

export class AiBuyerRecommendationsDto {
  @IsString()
  @IsOptional()
  companyId?: string

  @IsString()
  @IsOptional()
  industryId?: string

  @IsArray()
  @IsOptional()
  pastOrders?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  pastRfqs?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  savedProducts?: string[]

  @IsArray()
  @IsOptional()
  recentSearches?: string[]

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number
}

export class AiSellerRecommendationsDto {
  @IsString()
  @IsOptional()
  companyId?: string

  @IsArray()
  @IsOptional()
  products?: Record<string, unknown>[]

  @IsString()
  @IsOptional()
  industryId?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number
}

export class AiSearchSummaryDto {
  @IsString()
  query: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalResults?: number

  @IsArray()
  @IsOptional()
  topResults?: { name?: string; description?: string; price?: number }[]

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  location?: string
}

export class AiSmartFiltersDto {
  @IsString()
  query: string

  @IsString()
  @IsOptional()
  categoryId?: string

  @IsArray()
  @IsOptional()
  availableFilters?: string[]
}

export class AiCrossSellDto {
  @IsString()
  productId: string

  @IsString()
  @IsOptional()
  productName?: string

  @IsString()
  @IsOptional()
  categoryId?: string

  @IsString()
  @IsOptional()
  productType?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number
}

export class AiSearchSidebarDto {
  @IsString()
  @IsOptional()
  query?: string

  @IsString()
  @IsOptional()
  userId?: string

  @IsArray()
  @IsOptional()
  searchResults?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  recentSearches?: string[]

  @IsString()
  @IsOptional()
  industryId?: string

  @IsString()
  @IsOptional()
  categoryId?: string
}
