import { IsString, IsOptional, IsObject, IsNumber, Min, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiMorningBriefDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Date for morning brief' })
  date?: string

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Platform data' })
  platformData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Yesterday statistics' })
  yesterdayStats?: Record<string, unknown>
}

export class AiRevenueForecastDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Number of days to forecast' })
  forecastDays?: number

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Revenue data' })
  revenueData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Historical data for forecasting' })
  historicalData?: Record<string, unknown>
}

export class AiUserGrowthPredictionDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Buyer data' })
  buyerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Seller data' })
  sellerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'RM data' })
  rmData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiPropertyOptional({ description: 'Months to forecast' })
  forecastMonths?: number
}

export class AiFraudIntelligenceDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Wallet alerts data' })
  walletAlerts?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Referral alerts data' })
  referralAlerts?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Finance signals data' })
  financeSignals?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Disputes data' })
  disputesData?: Record<string, unknown>
}

export class AiChurnPredictionDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Buyer churn data' })
  buyerChurnData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Seller churn data' })
  sellerChurnData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Engagement data' })
  engagementData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Subscription data' })
  subscriptionData?: Record<string, unknown>
}

export class AiCategoryIntelligenceDto {
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Category data array' })
  categories?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Order data' })
  orderData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Revenue data' })
  revenueData?: Record<string, unknown>
}

export class AiGeoIntelligenceDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'City-level data' })
  cityData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'State-level data' })
  stateData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Buyer geographic data' })
  buyerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Seller geographic data' })
  sellerData?: Record<string, unknown>
}

export class AiMarketTrendsDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search trends data' })
  searchTrends?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Pricing data' })
  pricingData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Seasonal data' })
  seasonalData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Demand data' })
  demandData?: Record<string, unknown>
}

export class AiAlertsDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Revenue alert data' })
  revenueData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Fraud alert data' })
  fraudData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Server health data' })
  serverHealth?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Engagement alert data' })
  engagementData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Collections data' })
  collectionsData?: Record<string, unknown>
}

export class AiExecutiveCopilotDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Platform health data' })
  platformHealth?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Revenue metrics' })
  revenueMetrics?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Growth metrics' })
  growthMetrics?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Risk metrics' })
  riskMetrics?: Record<string, unknown>

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Focus area' })
  focusArea?: string
}

export class AiWeeklyMonthlyReportDto {
  @IsString()
  @ApiProperty({ description: 'Report type (weekly or monthly)' })
  reportType: 'weekly' | 'monthly'

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Period start date' })
  periodStart?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Period end date' })
  periodEnd?: string

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Analytics data' })
  analyticsData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Finance data' })
  financeData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Growth data' })
  growthData?: Record<string, unknown>
}

export class AiDecisionSupportDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Market data' })
  marketData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Platform data' })
  platformData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Campaign data' })
  campaignData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Membership data' })
  membershipData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Decision type' })
  decisionType?: string
}
