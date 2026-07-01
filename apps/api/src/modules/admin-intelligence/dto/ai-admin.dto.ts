import { IsString, IsOptional, IsObject, IsNumber, Min, IsArray } from 'class-validator'

export class AiMorningBriefDto {
  @IsString()
  @IsOptional()
  date?: string

  @IsObject()
  @IsOptional()
  platformData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  yesterdayStats?: Record<string, unknown>
}

export class AiRevenueForecastDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  forecastDays?: number

  @IsObject()
  @IsOptional()
  revenueData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  historicalData?: Record<string, unknown>
}

export class AiUserGrowthPredictionDto {
  @IsObject()
  @IsOptional()
  buyerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  sellerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  rmData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(1)
  forecastMonths?: number
}

export class AiFraudIntelligenceDto {
  @IsObject()
  @IsOptional()
  walletAlerts?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  referralAlerts?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  financeSignals?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  disputesData?: Record<string, unknown>
}

export class AiChurnPredictionDto {
  @IsObject()
  @IsOptional()
  buyerChurnData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  sellerChurnData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  engagementData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  subscriptionData?: Record<string, unknown>
}

export class AiCategoryIntelligenceDto {
  @IsArray()
  @IsOptional()
  categories?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  orderData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  revenueData?: Record<string, unknown>
}

export class AiGeoIntelligenceDto {
  @IsObject()
  @IsOptional()
  cityData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  stateData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  buyerData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  sellerData?: Record<string, unknown>
}

export class AiMarketTrendsDto {
  @IsObject()
  @IsOptional()
  searchTrends?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  pricingData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  seasonalData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  demandData?: Record<string, unknown>
}

export class AiAlertsDto {
  @IsObject()
  @IsOptional()
  revenueData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  fraudData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  serverHealth?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  engagementData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  collectionsData?: Record<string, unknown>
}

export class AiExecutiveCopilotDto {
  @IsObject()
  @IsOptional()
  platformHealth?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  revenueMetrics?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  growthMetrics?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  riskMetrics?: Record<string, unknown>

  @IsString()
  @IsOptional()
  focusArea?: string
}

export class AiWeeklyMonthlyReportDto {
  @IsString()
  reportType: 'weekly' | 'monthly'

  @IsString()
  @IsOptional()
  periodStart?: string

  @IsString()
  @IsOptional()
  periodEnd?: string

  @IsObject()
  @IsOptional()
  analyticsData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  financeData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  growthData?: Record<string, unknown>
}

export class AiDecisionSupportDto {
  @IsObject()
  @IsOptional()
  marketData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  platformData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  campaignData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  membershipData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  decisionType?: string
}
