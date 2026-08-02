import { IsString, IsOptional, IsObject, IsArray, IsNumber, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiSemanticSearchDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  query: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Location context' })
  location?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category context' })
  category?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry context' })
  industry?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string
}

export class AiSearchIntentDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  query: string
}

export class AiSimilarProductsDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Product name' })
  productName?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Product type' })
  productType?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number
}

export class AiSimilarSuppliersDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company name' })
  companyName?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Business type' })
  businessType?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number
}

export class AiPersonalizedRankingDto {
  @IsArray()
  @ApiProperty({ description: 'Results to rank' })
  results: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'User context for personalization' })
  userContext?: {
    industryId?: string
    recentClicks?: string[]
    recentOrders?: string[]
    recentRfqs?: string[]
    savedProducts?: string[]
  }

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search query' })
  query?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Sort field' })
  sortBy?: string
}

export class AiBuyerRecommendationsDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Past order history' })
  pastOrders?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Past RFQ history' })
  pastRfqs?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Saved product IDs' })
  savedProducts?: string[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent searches' })
  recentSearches?: string[]

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number
}

export class AiSellerRecommendationsDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company ID' })
  companyId?: string

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Seller products' })
  products?: Record<string, unknown>[]

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number
}

export class AiSearchSummaryDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  query: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total results count' })
  totalResults?: number

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Top search results' })
  topResults?: { name?: string; description?: string; price?: number }[]

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category context' })
  category?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Location context' })
  location?: string
}

export class AiSmartFiltersDto {
  @IsString()
  @ApiProperty({ description: 'Search query' })
  query: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Available filters' })
  availableFilters?: string[]
}

export class AiCrossSellDto {
  @IsString()
  @ApiProperty({ description: 'Product ID' })
  productId: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Product name' })
  productName?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Product type' })
  productType?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Maximum results' })
  limit?: number
}

export class AiSearchSidebarDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search query' })
  query?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search results' })
  searchResults?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent searches' })
  recentSearches?: string[]

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Industry ID' })
  industryId?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string
}
