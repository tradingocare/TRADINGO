import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class BuyerAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export class BuyerAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export class DashboardCopilotResponse {
  priorities: BuyerAgentPriority[];
  quickActions: BuyerAgentQuickAction[];
  urgentAlerts: BuyerAgentPriority[];
  savingsOpportunities: BuyerAgentPriority[];
  metrics: Record<string, number | string>;
}

export class ProcurementRecommendation {
  category: string;
  recommendation: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export class SmartProcurementResponse {
  buyingRecommendations: ProcurementRecommendation[];
  reorderTiming: Array<{ category: string; suggestedDate: string; reason: string }>;
  alternativeSuppliers: Array<{ forProduct: string; currentSupplier: string; alternatives: Array<{ companyName: string; trustScore: number; reason: string }> }>;
  riskWarnings: Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }>;
  categorySpendDistribution: Array<{ category: string; percentage: number; amount: number }>;
}

export class RfqSuggestion {
  field: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export class RfqAssistantResponse {
  suggestions: RfqSuggestion[];
  estimatedPricing: { min: number; max: number; currency: string } | null;
  categoryRecommendation: string | null;
  deliveryRecommendation: string | null;
  completenessScore: number;
}

export class SupplierIntelligenceItem {
  companyId: string;
  companyName: string;
  slug: string;
  trustScore: number;
  unifiedScore: number;
  grade: string;
  riskLevel: string;
  avgQualityScore: number;
  responseTime: string;
  distance?: string;
  industryMatch: boolean;
  pastOrderCount: number;
  recommendationScore: number;
}

export class SupplierIntelligenceResponse {
  suppliers: SupplierIntelligenceItem[];
  filters: Array<{ field: string; values: string[] }>;
  totalCount: number;
  topRecommendation: SupplierIntelligenceItem | null;
}

export class CounterOfferSuggestion {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reasoning: string;
}

export class NegotiationAdvisorResponse {
  strategy: string;
  counterOffers: CounterOfferSuggestion[];
  discountOpportunities: Array<{ type: string; potential: string; reasoning: string }>;
  riskIndicators: Array<{ factor: string; level: 'low' | 'medium' | 'high'; description: string }>;
  winProbability: number;
}

export class CostOptimizationItem {
  productId?: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  alternativePrice?: number;
  alternativeProduct?: string;
  alternativeBrand?: string;
  expectedSavings: number;
  savingsPercent: number;
  confidence: 'high' | 'medium' | 'low';
}

export class CostOptimizationResponse {
  items: CostOptimizationItem[];
  totalPotentialSavings: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  recommendations: string[];
}

export class BuyerNotificationItem {
  type: 'alert' | 'reminder' | 'opportunity' | 'milestone';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: Date;
}

export class BuyerNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: BuyerNotificationItem[];
  reminders: BuyerNotificationItem[];
  opportunities: BuyerNotificationItem[];
  milestones: BuyerNotificationItem[];
}

export class BuyerAgentInsightsResponse {
  dashboardCopilot: DashboardCopilotResponse;
  smartProcurement: SmartProcurementResponse;
  rfqAssistant: RfqAssistantResponse;
  supplierIntelligence: SupplierIntelligenceResponse;
  negotiationAdvisor: NegotiationAdvisorResponse;
  costOptimization: CostOptimizationResponse;
  buyerNotifications: BuyerNotificationsResponse;
}

