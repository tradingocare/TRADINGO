import { IsString, IsOptional, IsObject } from 'class-validator'

export class FounderAiInsight {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  confidence: number
  reason: string
  businessImpact: string
  recommendedAction: string
  expectedOutcome: string
  source: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export class FounderAiMeta {
  totalInsights: number
  criticalCount: number
  highCount: number
  refreshedAt: string
}

export class FounderAiResponse<T> {
  success: boolean
  data: T
  generatedAt: string
  insights: FounderAiInsight[]
  meta: FounderAiMeta
}

export class MorningBriefResponse {
  period: string
  date: string
  revenue: { today: number; yesterday: number; change: number; changeType: string }
  orders: { today: number; yesterday: number; change: number; changeType: string }
  signups: { today: number; total: number }
  rfqs: { today: number }
  quotes: { today: number }
  payments: { today: number; volume: number }
  disputes: { open: number; newToday: number }
  verificationQueue: number
  criticalAlerts: number
  aiOpportunities: string[]
  topPriorities: string[]
}

export class EveningSummaryResponse {
  period: string
  date: string
  dailyRevenue: number
  dailyOrders: number
  dailyGrowth: number
  completedMissions: number
  missedOpportunities: { expiredRfqs: number; cancelledOrders: number; abandonedQuotes: number }
  pendingActions: { pendingVerifications: number; overdueCollections: number; expiringSubscriptions: number }
  tomorrowFocus: string[]
}

export class ExecutiveDashboardResponse {
  period: string
  revenueTrend: { date: string; amount: number }[]
  cashFlow: { inflow: number; outflow: number; net: number }
  growth: { revenue: number; orders: number; users: number; rfqs: number }
  topCategories: { name: string; orderCount: number; revenue: number }[]
  topCities: { name: string; count: number }[]
  topStates: { name: string; count: number }[]
  topIndustries: { name: string; count: number }[]
  topBuyers: { companyName: string; orderCount: number; totalSpent: number }[]
  topSellers: { companyName: string; orderCount: number; revenue: number; trustScore: number }[]
  tradeServ: { status: string; message: string; estimatedProfessionals: number; topCategories: string[] }
}

export class DecisionCenterDto {
  @IsString()
  @IsOptional()
  focusArea?: string

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>
}

export class DecisionCenterResponse {
  recommendations: {
    area: string
    title: string
    description: string
    confidence: number
    reason: string
    businessImpact: string
    recommendedAction: string
    expectedOutcome: string
  }[]
}

export class RiskIntelligenceResponse {
  period: string
  paymentRisk: {
    overdueInvoices: number; overdueAmount: number; criticalAccounts: number;
    avgDaysOverdue: number; riskLevel: string
  }
  churnRisk: {
    expiringSubscriptions: number; inactiveSellers30d: number; inactiveBuyers30d: number;
    cancellationRate: number; highRiskAccounts: number
  }
  fraudRisk: {
    openDisputes: number; fraudAlerts24h: number; blacklistedCompanies: number;
    walletAlerts: number; riskLevel: string
  }
  deliveryRisk: {
    delayedShipments: number; deliveryFailureRate: number; avgDelayDays: number;
    highRiskRegions: string[]
  }
}

export class GrowthIntelligenceResponse {
  period: string
  highGrowthCategories: { name: string; growthRate: number; orderCount: number; revenue: number }[]
  emergingCities: { name: string; growthRate: number; newUsers: number; state: string }[]
  emergingIndustries: { name: string; growthRate: number; companyCount: number }[]
  businessOpportunities: { category: string; demandLevel: string; supplyGap: string; potentialRevenue: string }[]
}

export class FounderCopilotDto {
  @IsString()
  query: string

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>
}

export class FounderCopilotResponse {
  query: string
  answer: string
  confidence: number
  source: string
  insights: FounderAiInsight[]
}

// === Phase 18.4 additions ===

export class HealthScoreResponse {
  period: string
  overallScore: number
  grade: string
  revenue: { score: number; weight: number; contribution: number }
  growth: { score: number; weight: number; contribution: number }
  retention: { score: number; weight: number; contribution: number }
  trust: { score: number; weight: number; contribution: number }
  collections: { score: number; weight: number; contribution: number }
  marketplaceHealth: { score: number; weight: number; contribution: number }
  ecosystemReadiness: { score: number; weight: number; contribution: number }
}

export class ExecutivePriority {
  rank: number
  title: string
  description: string
  impactArea: string
  revenueImpact: string
  riskLevel: string
  roi: string
  timeframe: string
  recommendedAction: string
}

export class ExecutivePrioritiesResponse {
  period: string
  priorities: ExecutivePriority[]
}

export class TimelinePeriod {
  revenue: number
  orders: number
  signups: number
  rfqs: number
  quotes: number
  payments: number
  completedMissions: number
  openDisputes: number
}

export class ExecutiveTimelineResponse {
  today: TimelinePeriod
  thisWeek: TimelinePeriod
  thisMonth: TimelinePeriod
  thisQuarter: TimelinePeriod
  thisYear: TimelinePeriod
}

export class ReportSection {
  title: string
  data: Record<string, unknown>
  insights: string[]
}

export class ExecutiveReportResponse {
  period: string
  title: string
  date: string
  summary: string
  sections: ReportSection[]
  recommendations: string[]
}

// === Phase 23.0 â€” Domain Intelligence Responses ===

export class MarketplaceIntelligenceResponse {
  period: string
  demand: { activeRfqs: number; productRequests: number; searchVolume: number }
  supply: { activeProducts: number; activeSellers: number; categoriesWithSupply: number }
  conversion: { rfqToQuoteRate: number; quoteToOrderRate: number; avgConversionDays: number }
  rfqs: { total: number; thisMonth: number; byCategory: { name: string; count: number }[]; byIndustry: { name: string; count: number }[] }
  quotes: { total: number; thisMonth: number; avgResponseDays: number; acceptanceRate: number }
  orders: { total: number; thisMonth: number; avgValue: number; byCategory: { name: string; count: number }[] }
  catalogQuality?: {
    avgScore: number
    scoredProducts: number
    duplicateCount: number
    missingImages: number
    missingSeo: number
    missingSpecs: number
    missingAttributes: number
    marketplaceQualityIndex: number
    sellerQualityIndex?: {
      totalSellersWithQuality: number
      excellentSellers: number
      goodSellers: number
      fairSellers: number
      poorSellers: number
      topSellerQuality: { companyId: string; companyName: string; avgScore: number; productCount: number }[]
    }
  }
  brandHealth?: {
    totalBrands: number
    verifiedBrands: number
    verificationRate: number
  }
  categoryHealth?: {
    totalCategories: number
    categoriesWithProducts: number
    topCategoriesByQuality: { name: string; avgScore: number; productCount: number }[]
    bottomCategoriesByQuality: { name: string; avgScore: number; productCount: number }[]
  }
  aiPlatformHealth?: {
    totalRequests: number
    successRate: number
    avgLatencyMs: number
    activeProviders: number
    circuitBreakersOpen: number
    requestsToday: number
    topFeatures: { taskType: string; count: number }[]
  }
}

export class TradeservIntelligenceResponse {
  period: string
  professionalGrowth: { total: number; growth30d: number; newThisMonth: number }
  serviceDemand: { totalServices: number; topCategories: { name: string; count: number }[]; bookingRate: number }
  profileQuality: { avgCompletion: number; avgTrustScore: number; verificationRate: number }
  verificationHealth: { total: number; approved: number; pending: number; rejected: number; expired: number }
}

export class TradeTalkIntelligenceResponse {
  period: string
  communityGrowth: { totalCommunities: number; growth30d: number; newThisMonth: number }
  trendingIndustries: { name: string; communityCount: number; memberCount: number }[]
  mostActiveCommunities: { name: string; memberCount: number; recentActivity: number }[]
  membershipAdoption: { totalMembers: number; activeMembers: number; inviteAcceptanceRate: number }
}

export class MembershipIntelligenceResponse {
  period: string
  planDistribution: { planName: string; subscriberCount: number; percentage: number }[]
  renewals: { thisMonth: number; next30Days: number; atRisk: number }
  expiries: { thisMonth: number; next30Days: number; gracePeriod: number }
  upgradeOpportunities: { eligibleCount: number; potentialRevenue: string; byPlan: { from: string; to: string; count: number }[] }
}

export class GocashIntelligenceResponse {
  period: string
  walletActivity: { totalWallets: number; totalVolume: string; avgBalance: string }
  xpDistribution: { totalXp: string; avgPerUser: string; byLevel: { level: number; userCount: number; totalXp: string }[] }
  rewardUtilization: { totalEarned: string; totalRedeemed: string; utilizationRate: number }
  missionCompletion: { totalMissions: number; completionRate: number; activeMissions: number }
}

export class TradTrustIntelligenceResponse {
  period: string
  trustDistribution: { grade: string; companyCount: number; percentage: number }[]
  verificationFunnel: { total: number; approved: number; pending: number; rejected: number; expired: number }
  riskAnalysis: { riskLevel: string; count: number; percentage: number }[]
  improvementRecommendations: { area: string; currentScore: number; impact: string; suggestion: string }[]
}

export class AdvertisingIntelligenceResponse {
  period: string
  campaignROI: { avgRoi: number; byType: { type: string; roi: number; spend: string }[] }
  topPerformingAds: { title: string; impressions: number; clicks: number; conversions: number; roi: number }[]
  spend: { total: string; byType: { type: string; amount: string; percentage: number }[] }
  ctr: { average: number; byType: { type: string; ctr: number }[] }
  conversion: { totalConversions: number; avgConversionRate: number; byType: { type: string; conversions: number; rate: number }[] }
}

export class SecurityIntelligenceResponse {
  platformSecurityScore: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  trends: {
    daily: { date: string; count: number }[]
    weeklyChange: number
  }
  incidents: {
    open: number
    resolved: number
    autoResolved: number
    severityDistribution: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }
    sourceDistribution: Record<string, number>
  }
  authentication: {
    failedLogins24h: number
    accountLocks24h: number
    privilegeChanges24h: number
  }
  promptInjection: {
    totalBlocked: number
    topFields: { field: string; count: number }[]
  }
  websocketRejections: {
    total: number
    byReason: Record<string, number>
  }
  topRisks: { title: string; severity: string; count: number; trend: 'up' | 'down' | 'stable' }[]
}

