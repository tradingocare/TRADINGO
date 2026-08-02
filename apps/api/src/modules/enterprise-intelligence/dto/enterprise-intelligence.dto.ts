import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DigitalTwinSnapshotDto {
  timestamp: string;
  marketplace: {
    totalBuyers: number;
    totalSellers: number;
    totalProfessionals: number;
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    totalOrders: number;
    totalRevenue: number;
    totalRfqs: number;
    totalQuotes: number;
    totalNegotiations: number;
    gmv: number;
  };
  trust: {
    averageTrustScore: number;
    verifiedCompanies: number;
    trustDistribution: Record<string, number>;
    gradeDistribution: Record<string, number>;
  };
  growth: {
    userGrowth30d: number;
    companyGrowth30d: number;
    orderGrowth30d: number;
    revenueGrowth30d: number;
    productGrowth30d: number;
  };
  community: {
    totalCommunities: number;
    totalMembers: number;
    communityGrowth30d: number;
    memberGrowth30d: number;
  };
  tradeserv: {
    totalProfessionals: number;
    totalServices: number;
    totalBookings: number;
    totalProposals: number;
  };
  ai: {
    totalRequests: number;
    successRate: number;
    avgLatencyMs: number;
    activeProviders: number;
    companiesUsingAi: number;
  };
  membership: {
    planDistribution: Record<string, number>;
    subscribersTotal: number;
    expiringSoon: number;
  };
  health: {
    marketplaceHealthIndex: number;
    businessConfidenceIndex: number;
    systemStatus: string;
    queueDepth: number;
    openCircuitBreakers: number;
  };
}

export class MarketplaceHealthIndexDto {
  overall: number;
  grade: string;
  dimensions: Array<{
    name: string;
    score: number;
    weight: number;
    status: string;
    description: string;
  }>;
  trend: string;
  recommendations: string[];
}

export class BusinessConfidenceIndexDto {
  overall: number;
  grade: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: string;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  summary: string;
}

export class SupplyDemandBalanceDto {
  overall: string;
  categories: Array<{
    name: string;
    supplyScore: number;
    demandScore: number;
    imbalance: 'oversupplied' | 'balanced' | 'undersupplied';
    gap: number;
    opportunity: string;
  }>;
}

export class CategoryMomentumDto {
  categories: Array<{
    name: string;
    momentum: number;
    growthRate: number;
    orderCount: number;
    revenue: number;
    sellerCount: number;
    trend: 'rising' | 'stable' | 'declining';
  }>;
}

export class RegionalTradeHeatmapDto {
  regions: Array<{
    name: string;
    state: string;
    tradeVolume: number;
    buyerCount: number;
    sellerCount: number;
    supplyScore: number;
    demandScore: number;
    growthRate: number;
    topCategories: string[];
  }>;
}

export class GrowthVelocityDto {
  overall: number;
  dimensions: Array<{
    name: string;
    currentValue: number;
    previousValue: number;
    growthRate: number;
    trend: string;
  }>;
}

export class TrustDistributionDto {
  averageScore: number;
  gradeDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  verificationFunnel: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
}

export class DemandForecastDto {
  period: string;
  projections: Array<{
    metric: string;
    currentValue: number;
    forecastedValue: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
    growthRate: number;
  }>;
  methodology: string;
}

export class PredictionSummaryDto {
  demand: DemandForecastDto;
  supply: { period: string; projections: Array<{ category: string; currentSupply: number; forecastedDemand: number; gap: number; confidence: number }> };
  gmv: { period: string; current: number; forecasted: number; growthRate: number; confidence: number };
  revenue: { period: string; current: number; forecasted: number; growthRate: number; confidence: number };
  membership: { period: string; currentSubscribers: number; forecasted: number; growthRate: number; confidence: number };
  sellerGrowth: { period: string; current: number; forecasted: number; growthRate: number; confidence: number };
  buyerGrowth: { period: string; current: number; forecasted: number; growthRate: number; confidence: number };
  aiAdoption: { period: string; currentUsers: number; forecastedUsers: number; growthRate: number; confidence: number };
  communityActivity: { period: string; currentActivity: number; forecasted: number; growthRate: number; confidence: number };
}

export class OpportunityDto {
  id: string;
  category: string;
  title: string;
  description: string;
  potentialValue: string;
  confidence: number;
  effort: string;
  timeframe: string;
  metrics: Array<{ label: string; value: string | number }>;
  source: string;
}

export class OpportunityEngineResponseDto {
  totalOpportunities: number;
  totalPotentialValue: string;
  emergingIndustries: OpportunityDto[];
  supplyShortages: OpportunityDto[];
  highGrowthRegions: OpportunityDto[];
  highValueBuyers: OpportunityDto[];
  topSellers: OpportunityDto[];
  crossSelling: OpportunityDto[];
  tradeservDemand: OpportunityDto[];
  communityOpportunities: OpportunityDto[];
}

export class RiskSignalDto {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  currentValue: number;
  threshold: number;
  affectedEntities: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendedAction: string;
}

export class RiskIntelligenceResponseDto {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  overallHealth: string;
  marketplaceImbalance: RiskSignalDto[];
  fraudSpikes: RiskSignalDto[];
  churn: RiskSignalDto[];
  lowEngagement: RiskSignalDto[];
  revenueAnomalies: RiskSignalDto[];
  categoryDecline: RiskSignalDto[];
  queueCongestion: RiskSignalDto[];
  infrastructureRisks: RiskSignalDto[];
}

export class RecommendationDto {
  id: string;
  role: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
  confidence: number;
  actionable: boolean;
  source: string;
}

export class AutonomousRecommendationsResponseDto {
  total: number;
  marketplace: RecommendationDto[];
  seller: RecommendationDto[];
  buyer: RecommendationDto[];
  professional: RecommendationDto[];
  community: RecommendationDto[];
  founder: RecommendationDto[];
  admin: RecommendationDto[];
}

export class EnterpriseAnalyticsDto {
  aiRuntime: {
    queueDepth: number;
    activeWorkers: number;
    waitingJobs: number;
    completedJobs24h: number;
    failedJobs24h: number;
    avgLatencyMs24h: number;
    slaBreaches24h: number;
    circuitBreakers: { closed: number; open: number; halfOpen: number };
  };
  federation: {
    totalCollaborations: number;
    activeCollaborations: number;
    agents: Array<{ id: string; name: string; totalCalls: number; successRate: number }>;
  };
  marketplace: {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalSellers: number;
    totalBuyers: number;
    totalRfqs: number;
  };
  tradeserv: {
    totalProfessionals: number;
    totalBookings: number;
    totalServices: number;
    totalProposals: number;
  };
  tradetalk: {
    totalCommunities: number;
    totalMembers: number;
    totalDiscussions: number;
    activeUsers: number;
  };
  advertising: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
  };
  membership: {
    totalSubscribers: number;
    planDistribution: Record<string, number>;
    expiringSoon: number;
  };
  finance: {
    totalRevenue: number;
    totalPayouts: number;
    totalOutstanding: number;
    creditUtilization: number;
  };
  notifications: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  tradtrust: {
    averageScore: number;
    scoredCompanies: number;
    gradeDistribution: Record<string, number>;
  };
}

export class EnterpriseIntelligenceResponseDto {
  digitalTwin: DigitalTwinSnapshotDto;
  healthIndex: MarketplaceHealthIndexDto;
  businessConfidence: BusinessConfidenceIndexDto;
  supplyDemand: SupplyDemandBalanceDto;
  categoryMomentum: CategoryMomentumDto;
  regionalHeatmap: RegionalTradeHeatmapDto;
  growthVelocity: GrowthVelocityDto;
  trustDistribution: TrustDistributionDto;
  predictions: PredictionSummaryDto;
  opportunities: OpportunityEngineResponseDto;
  risks: RiskIntelligenceResponseDto;
  recommendations: AutonomousRecommendationsResponseDto;
  analytics: EnterpriseAnalyticsDto;
  generatedAt: string;
}

