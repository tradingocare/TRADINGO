import { apiClient } from '@/lib/api/client';

export interface Marketplace {
  totalBuyers: number; totalSellers: number; totalProfessionals: number;
  totalProducts: number; activeProducts: number; totalCategories: number;
  totalOrders: number; totalRevenue: number; totalRfqs: number;
  totalQuotes: number; totalNegotiations: number; gmv: number;
}
export interface TrustStats { averageTrustScore: number; verifiedCompanies: number; trustDistribution: Record<string, number>; gradeDistribution: Record<string, number>; }
export interface Growth { userGrowth30d: number; companyGrowth30d: number; orderGrowth30d: number; revenueGrowth30d: number; productGrowth30d: number; }
export interface Community { totalCommunities: number; totalMembers: number; communityGrowth30d: number; memberGrowth30d: number; }
export interface TradeservStats { totalProfessionals: number; totalServices: number; totalBookings: number; totalProposals: number; }
export interface AiStats { totalRequests: number; successRate: number; avgLatencyMs: number; activeProviders: number; companiesUsingAi: number; }
export interface MembershipStats { planDistribution: Record<string, number>; subscribersTotal: number; expiringSoon: number; }
export interface HealthStats { marketplaceHealthIndex: number; businessConfidenceIndex: number; systemStatus: string; queueDepth: number; openCircuitBreakers: number; }
export interface DigitalTwin { timestamp: string; marketplace: Marketplace; trust: TrustStats; growth: Growth; community: Community; tradeserv: TradeservStats; ai: AiStats; membership: MembershipStats; health: HealthStats; }

export interface HealthDimension { name: string; score: number; weight: number; status: string; description: string; }
export interface HealthIndex { overall: number; grade: string; dimensions: HealthDimension[]; trend: string; recommendations: string[]; }

export interface ConfidenceFactor { name: string; score: number; weight: number; impact: string; }
export interface BusinessConfidence { overall: number; grade: string; factors: ConfidenceFactor[]; trend: string; summary: string; }

export interface CategoryBalance { name: string; supplyScore: number; demandScore: number; imbalance: string; gap: number; opportunity: string; }
export interface SupplyDemand { overall: string; categories: CategoryBalance[]; }

export interface CategoryMom { name: string; momentum: number; growthRate: number; orderCount: number; revenue: number; sellerCount: number; trend: string; }
export interface CategoryMomentum { categories: CategoryMom[]; }

export interface Region { name: string; state: string; tradeVolume: number; buyerCount: number; sellerCount: number; supplyScore: number; demandScore: number; growthRate: number; topCategories: string[]; }
export interface RegionalHeatmap { regions: Region[]; }

export interface GrowthDim { name: string; currentValue: number; previousValue: number; growthRate: number; trend: string; }
export interface GrowthVelocity { overall: number; dimensions: GrowthDim[]; }

export interface VerificationFunnel { pending: number; verified: number; rejected: number; total: number; }
export interface TrustDistribution { averageScore: number; gradeDistribution: Record<string, number>; riskDistribution: Record<string, number>; verificationFunnel: VerificationFunnel; }

export interface Projection { metric: string; currentValue: number; forecastedValue: number; lowerBound: number; upperBound: number; confidence: number; growthRate: number; }
export interface DemandForecast { period: string; methodology: string; projections: Projection[]; }
export interface SupplyProjection { category: string; currentSupply: number; forecastedDemand: number; gap: number; confidence: number; }
export interface ForecastMetric { period: string; current: number; forecasted: number; growthRate: number; confidence: number; }
export interface Predictions { demand: DemandForecast; supply: { period: string; projections: SupplyProjection[] }; gmv: ForecastMetric; revenue: ForecastMetric; membership: ForecastMetric; sellerGrowth: ForecastMetric; buyerGrowth: ForecastMetric; aiAdoption: ForecastMetric; communityActivity: ForecastMetric; }

export interface Opportunity { id: string; category: string; title: string; description: string; potentialValue: string; confidence: number; effort: string; timeframe: string; metrics: Array<{ label: string; value: string | number }>; source: string; }
export interface Opportunities { totalOpportunities: number; totalPotentialValue: string; emergingIndustries: Opportunity[]; supplyShortages: Opportunity[]; highGrowthRegions: Opportunity[]; highValueBuyers: Opportunity[]; topSellers: Opportunity[]; crossSelling: Opportunity[]; tradeservDemand: Opportunity[]; communityOpportunities: Opportunity[]; }

export interface RiskSignal { id: string; category: string; title: string; description: string; severity: string; currentValue: number; threshold: number; affectedEntities: number; trend: string; recommendedAction: string; }
export interface Risks { totalRisks: number; criticalCount: number; highCount: number; overallHealth: string; marketplaceImbalance: RiskSignal[]; fraudSpikes: RiskSignal[]; churn: RiskSignal[]; lowEngagement: RiskSignal[]; revenueAnomalies: RiskSignal[]; categoryDecline: RiskSignal[]; queueCongestion: RiskSignal[]; infrastructureRisks: RiskSignal[]; }

export interface Recommendation { id: string; role: string; category: string; title: string; description: string; priority: string; impact: string; effort: string; confidence: number; actionable: boolean; source: string; }
export interface Recommendations { total: number; marketplace: Recommendation[]; seller: Recommendation[]; buyer: Recommendation[]; professional: Recommendation[]; community: Recommendation[]; founder: Recommendation[]; admin: Recommendation[]; }

export interface CircuitBreakers { closed: number; open: number; halfOpen: number; }
export interface AiRuntimeAnalytics { queueDepth: number; activeWorkers: number; waitingJobs: number; completedJobs24h: number; failedJobs24h: number; avgLatencyMs24h: number; slaBreaches24h: number; circuitBreakers: CircuitBreakers; }
export interface AgentUtilization { id: string; name: string; totalCalls: number; successRate: number; }
export interface FederationAnalytics { totalCollaborations: number; activeCollaborations: number; agents: AgentUtilization[]; }
export interface NotifStats { totalSent: number; delivered: number; failed: number; pending: number; }
export interface TradTrustAnalytics { averageScore: number; scoredCompanies: number; gradeDistribution: Record<string, number>; }
export interface EnterpriseAnalytics {
  aiRuntime: AiRuntimeAnalytics; federation: FederationAnalytics;
  marketplace: { totalOrders: number; totalRevenue: number; totalProducts: number; totalSellers: number; totalBuyers: number; totalRfqs: number; };
  tradeserv: { totalProfessionals: number; totalBookings: number; totalServices: number; totalProposals: number; };
  tradetalk: { totalCommunities: number; totalMembers: number; totalDiscussions: number; activeUsers: number; };
  advertising: { totalCampaigns: number; activeCampaigns: number; totalSpend: number; totalImpressions: number; totalClicks: number; };
  membership: { totalSubscribers: number; planDistribution: Record<string, number>; expiringSoon: number; };
  finance: { totalRevenue: number; totalPayouts: number; totalOutstanding: number; creditUtilization: number; };
  notifications: NotifStats; tradtrust: TradTrustAnalytics;
}

export interface EnterpriseIntelligence {
  digitalTwin: DigitalTwin;
  healthIndex: HealthIndex;
  businessConfidence: BusinessConfidence;
  supplyDemand: SupplyDemand;
  categoryMomentum: CategoryMomentum;
  regionalHeatmap: RegionalHeatmap;
  growthVelocity: GrowthVelocity;
  trustDistribution: TrustDistribution;
  predictions: Predictions;
  opportunities: Opportunities;
  risks: Risks;
  recommendations: Recommendations;
  analytics: EnterpriseAnalytics;
  generatedAt: string;
}

export const enterpriseIntelligenceApi = {
  getFull: () =>
    apiClient.get<EnterpriseIntelligence>('/enterprise-intelligence/full').then(r => r.data),

  getDigitalTwin: () =>
    apiClient.get<DigitalTwin>('/enterprise-intelligence/digital-twin').then(r => r.data),

  getHealthIndex: () =>
    apiClient.get<HealthIndex>('/enterprise-intelligence/health-index').then(r => r.data),

  getBusinessConfidence: () =>
    apiClient.get<BusinessConfidence>('/enterprise-intelligence/business-confidence').then(r => r.data),

  getSupplyDemand: () =>
    apiClient.get<SupplyDemand>('/enterprise-intelligence/supply-demand').then(r => r.data),

  getCategoryMomentum: () =>
    apiClient.get<CategoryMomentum>('/enterprise-intelligence/category-momentum').then(r => r.data),

  getRegionalHeatmap: () =>
    apiClient.get<RegionalHeatmap>('/enterprise-intelligence/regional-heatmap').then(r => r.data),

  getGrowthVelocity: () =>
    apiClient.get<GrowthVelocity>('/enterprise-intelligence/growth-velocity').then(r => r.data),

  getTrustDistribution: () =>
    apiClient.get<TrustDistribution>('/enterprise-intelligence/trust-distribution').then(r => r.data),

  getPredictions: () =>
    apiClient.get<Predictions>('/enterprise-intelligence/predictions').then(r => r.data),

  getOpportunities: () =>
    apiClient.get<Opportunities>('/enterprise-intelligence/opportunities').then(r => r.data),

  getRisks: () =>
    apiClient.get<Risks>('/enterprise-intelligence/risks').then(r => r.data),

  getRecommendations: () =>
    apiClient.get<Recommendations>('/enterprise-intelligence/recommendations').then(r => r.data),

  getAnalytics: () =>
    apiClient.get<EnterpriseAnalytics>('/enterprise-intelligence/analytics').then(r => r.data),
};
