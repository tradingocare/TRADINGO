import api from './client'

export interface FounderAiInsight {
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

export interface FounderAiMeta {
  totalInsights: number
  criticalCount: number
  highCount: number
  refreshedAt: string
}

export interface FounderAiResponse<T> {
  success: boolean
  data: T
  generatedAt: string
  insights: FounderAiInsight[]
  meta: FounderAiMeta
}

export interface MorningBriefResponse {
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

export interface EveningSummaryResponse {
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

export interface ExecutiveDashboardResponse {
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

export interface DecisionCenterResponse {
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

export interface RiskIntelligenceResponse {
  period: string
  paymentRisk: { overdueInvoices: number; overdueAmount: number; criticalAccounts: number; avgDaysOverdue: number; riskLevel: string }
  churnRisk: { expiringSubscriptions: number; inactiveSellers30d: number; inactiveBuyers30d: number; cancellationRate: number; highRiskAccounts: number }
  fraudRisk: { openDisputes: number; fraudAlerts24h: number; blacklistedCompanies: number; walletAlerts: number; riskLevel: string }
  deliveryRisk: { delayedShipments: number; deliveryFailureRate: number; avgDelayDays: number; highRiskRegions: string[] }
}

export interface GrowthIntelligenceResponse {
  period: string
  highGrowthCategories: { name: string; growthRate: number; orderCount: number; revenue: number }[]
  emergingCities: { name: string; growthRate: number; newUsers: number; state: string }[]
  emergingIndustries: { name: string; growthRate: number; companyCount: number }[]
  businessOpportunities: { category: string; demandLevel: string; supplyGap: string; potentialRevenue: string }[]
}

export interface FounderCopilotResponse {
  query: string
  answer: string
  confidence: number
  source: string
  insights: FounderAiInsight[]
}

// Phase 18.4 additions
export interface HealthScoreResponse {
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

export interface ExecutivePriority {
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

export interface ExecutivePrioritiesResponse {
  period: string
  priorities: ExecutivePriority[]
}

export interface TimelinePeriod {
  revenue: number; orders: number; signups: number; rfqs: number
  quotes: number; payments: number; completedMissions: number; openDisputes: number
}

export interface ExecutiveTimelineResponse {
  today: TimelinePeriod
  thisWeek: TimelinePeriod
  thisMonth: TimelinePeriod
  thisQuarter: TimelinePeriod
  thisYear: TimelinePeriod
}

export interface ReportSection {
  title: string
  data: Record<string, unknown>
  insights: string[]
}

export interface ExecutiveReportResponse {
  period: string
  title: string
  date: string
  summary: string
  sections: ReportSection[]
  recommendations: string[]
}

export function getMorningBrief() {
  return api.get<FounderAiResponse<MorningBriefResponse>>('/admin/founder-ai/morning-brief')
}

export function getEveningSummary() {
  return api.get<FounderAiResponse<EveningSummaryResponse>>('/admin/founder-ai/evening-summary')
}

export function getExecutiveDashboard() {
  return api.get<FounderAiResponse<ExecutiveDashboardResponse>>('/admin/founder-ai/executive-dashboard')
}

export function getDecisionCenter(data?: { focusArea?: string; context?: Record<string, unknown> }) {
  return api.post<FounderAiResponse<DecisionCenterResponse>>('/admin/founder-ai/decision-center', data ?? {})
}

export function getRiskIntelligence() {
  return api.get<FounderAiResponse<RiskIntelligenceResponse>>('/admin/founder-ai/risk-intelligence')
}

export function getGrowthIntelligence() {
  return api.get<FounderAiResponse<GrowthIntelligenceResponse>>('/admin/founder-ai/growth-intelligence')
}

export function getFounderCopilot(data: { query: string; context?: Record<string, unknown> }) {
  return api.post<FounderAiResponse<FounderCopilotResponse>>('/admin/founder-ai/copilot', data)
}

export function getHealthScore() {
  return api.get<FounderAiResponse<HealthScoreResponse>>('/admin/founder-ai/health-score')
}

export function getExecutivePriorities() {
  return api.get<FounderAiResponse<ExecutivePrioritiesResponse>>('/admin/founder-ai/priorities')
}

export function getExecutiveTimeline() {
  return api.get<FounderAiResponse<ExecutiveTimelineResponse>>('/admin/founder-ai/timeline')
}

export function getExecutiveReport(type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
  return api.get<FounderAiResponse<ExecutiveReportResponse>>(`/admin/founder-ai/report/${type}`)
}

// Phase 23.0 — Domain Intelligence
export interface MarketplaceIntelligenceResponse {
  period: string
  demand: { activeRfqs: number; productRequests: number; searchVolume: number }
  supply: { activeProducts: number; activeSellers: number; categoriesWithSupply: number }
  conversion: { rfqToQuoteRate: number; quoteToOrderRate: number; avgConversionDays: number }
  rfqs: { total: number; thisMonth: number; byCategory: { name: string; count: number }[]; byIndustry: { name: string; count: number }[] }
  quotes: { total: number; thisMonth: number; avgResponseDays: number; acceptanceRate: number }
  orders: { total: number; thisMonth: number; avgValue: number; byCategory: { name: string; count: number }[] }
}

export interface TradeservIntelligenceResponse {
  period: string
  professionalGrowth: { total: number; growth30d: number; newThisMonth: number }
  serviceDemand: { totalServices: number; topCategories: { name: string; count: number }[]; bookingRate: number }
  profileQuality: { avgCompletion: number; avgTrustScore: number; verificationRate: number }
  verificationHealth: { total: number; approved: number; pending: number; rejected: number; expired: number }
}

export interface TradeTalkIntelligenceResponse {
  period: string
  communityGrowth: { totalCommunities: number; growth30d: number; newThisMonth: number }
  trendingIndustries: { name: string; communityCount: number; memberCount: number }[]
  mostActiveCommunities: { name: string; memberCount: number; recentActivity: number }[]
  membershipAdoption: { totalMembers: number; activeMembers: number; inviteAcceptanceRate: number }
}

export interface MembershipIntelligenceResponse {
  period: string
  planDistribution: { planName: string; subscriberCount: number; percentage: number }[]
  renewals: { thisMonth: number; next30Days: number; atRisk: number }
  expiries: { thisMonth: number; next30Days: number; gracePeriod: number }
  upgradeOpportunities: { eligibleCount: number; potentialRevenue: string; byPlan: { from: string; to: string; count: number }[] }
}

export interface GocashIntelligenceResponse {
  period: string
  walletActivity: { totalWallets: number; totalVolume: string; avgBalance: string }
  xpDistribution: { totalXp: string; avgPerUser: string; byLevel: { level: number; userCount: number; totalXp: string }[] }
  rewardUtilization: { totalEarned: string; totalRedeemed: string; utilizationRate: number }
  missionCompletion: { totalMissions: number; completionRate: number; activeMissions: number }
}

export interface TradTrustIntelligenceResponse {
  period: string
  trustDistribution: { grade: string; companyCount: number; percentage: number }[]
  verificationFunnel: { total: number; approved: number; pending: number; rejected: number; expired: number }
  riskAnalysis: { riskLevel: string; count: number; percentage: number }[]
  improvementRecommendations: { area: string; currentScore: number; impact: string; suggestion: string }[]
}

export interface AdvertisingIntelligenceResponse {
  period: string
  campaignROI: { avgRoi: number; byType: { type: string; roi: number; spend: string }[] }
  topPerformingAds: { title: string; impressions: number; clicks: number; conversions: number; roi: number }[]
  spend: { total: string; byType: { type: string; amount: string; percentage: number }[] }
  ctr: { average: number; byType: { type: string; ctr: number }[] }
  conversion: { totalConversions: number; avgConversionRate: number; byType: { type: string; conversions: number; rate: number }[] }
}

export function getMarketplaceIntelligence() {
  return api.get<FounderAiResponse<MarketplaceIntelligenceResponse>>('/admin/founder-ai/marketplace-intelligence')
}

export function getTradeservIntelligence() {
  return api.get<FounderAiResponse<TradeservIntelligenceResponse>>('/admin/founder-ai/tradeserv-intelligence')
}

export function getTradeTalkIntelligence() {
  return api.get<FounderAiResponse<TradeTalkIntelligenceResponse>>('/admin/founder-ai/tradetalk-intelligence')
}

export function getMembershipIntelligence() {
  return api.get<FounderAiResponse<MembershipIntelligenceResponse>>('/admin/founder-ai/membership-intelligence')
}

export function getGocashIntelligence() {
  return api.get<FounderAiResponse<GocashIntelligenceResponse>>('/admin/founder-ai/gocash-intelligence')
}

export function getTradTrustIntelligence() {
  return api.get<FounderAiResponse<TradTrustIntelligenceResponse>>('/admin/founder-ai/tradtrust-intelligence')
}

export function getAdvertisingIntelligence() {
  return api.get<FounderAiResponse<AdvertisingIntelligenceResponse>>('/admin/founder-ai/advertising-intelligence')
}

export interface SecurityIntelligenceResponse {
  platformSecurityScore: number
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  trends: { daily: { date: string; count: number }[]; weeklyChange: number }
  incidents: {
    open: number; resolved: number; autoResolved: number
    severityDistribution: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }
    sourceDistribution: Record<string, number>
  }
  authentication: { failedLogins24h: number; accountLocks24h: number; privilegeChanges24h: number }
  promptInjection: { totalBlocked: number; topFields: { field: string; count: number }[] }
  websocketRejections: { total: number; byReason: Record<string, number> }
  topRisks: { title: string; severity: string; count: number; trend: 'up' | 'down' | 'stable' }[]
}

export function getSecurityIntelligence() {
  return api.get<FounderAiResponse<SecurityIntelligenceResponse>>('/admin/founder-ai/security-intelligence')
}
