import api from './client';

export interface BuyerAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export interface BuyerAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardCopilotResponse {
  priorities: BuyerAgentPriority[];
  quickActions: BuyerAgentQuickAction[];
  urgentAlerts: BuyerAgentPriority[];
  savingsOpportunities: BuyerAgentPriority[];
  metrics: Record<string, number | string>;
}

export interface ProcurementRecommendation {
  category: string;
  recommendation: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface SmartProcurementResponse {
  buyingRecommendations: ProcurementRecommendation[];
  reorderTiming: Array<{ category: string; suggestedDate: string; reason: string }>;
  alternativeSuppliers: Array<{ forProduct: string; currentSupplier: string; alternatives: Array<{ companyName: string; trustScore: number; reason: string }> }>;
  riskWarnings: Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }>;
  categorySpendDistribution: Array<{ category: string; percentage: number; amount: number }>;
}

export interface RfqSuggestion {
  field: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface RfqAssistantResponse {
  suggestions: RfqSuggestion[];
  estimatedPricing: { min: number; max: number; currency: string } | null;
  categoryRecommendation: string | null;
  deliveryRecommendation: string | null;
  completenessScore: number;
}

export interface SupplierIntelligenceItem {
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

export interface SupplierIntelligenceResponse {
  suppliers: SupplierIntelligenceItem[];
  filters: Array<{ field: string; values: string[] }>;
  totalCount: number;
  topRecommendation: SupplierIntelligenceItem | null;
}

export interface CounterOfferSuggestion {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reasoning: string;
}

export interface NegotiationAdvisorResponse {
  strategy: string;
  counterOffers: CounterOfferSuggestion[];
  discountOpportunities: Array<{ type: string; potential: string; reasoning: string }>;
  riskIndicators: Array<{ factor: string; level: 'low' | 'medium' | 'high'; description: string }>;
  winProbability: number;
}

export interface CostOptimizationItem {
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

export interface CostOptimizationResponse {
  items: CostOptimizationItem[];
  totalPotentialSavings: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  recommendations: string[];
}

export interface BuyerNotificationItem {
  type: 'alert' | 'reminder' | 'opportunity' | 'milestone';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: Date;
}

export interface BuyerNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: BuyerNotificationItem[];
  reminders: BuyerNotificationItem[];
  opportunities: BuyerNotificationItem[];
  milestones: BuyerNotificationItem[];
}

export interface BuyerAgentInsightsResponse {
  dashboardCopilot: DashboardCopilotResponse;
  smartProcurement: SmartProcurementResponse;
  rfqAssistant: RfqAssistantResponse;
  supplierIntelligence: SupplierIntelligenceResponse;
  negotiationAdvisor: NegotiationAdvisorResponse;
  costOptimization: CostOptimizationResponse;
  buyerNotifications: BuyerNotificationsResponse;
}

export const getBuyerDashboardCopilot = () =>
  api.get<DashboardCopilotResponse>('/buyer/agent/dashboard-copilot').then(r => r.data);

export const getSmartProcurement = () =>
  api.get<SmartProcurementResponse>('/buyer/agent/smart-procurement').then(r => r.data);

export const getBuyerRfqAssistant = () =>
  api.get<RfqAssistantResponse>('/buyer/agent/rfq-assistant').then(r => r.data);

export const getSupplierIntelligence = () =>
  api.get<SupplierIntelligenceResponse>('/buyer/agent/supplier-intelligence').then(r => r.data);

export const getBuyerNegotiationAdvisor = () =>
  api.get<NegotiationAdvisorResponse>('/buyer/agent/negotiation-advisor').then(r => r.data);

export const getCostOptimization = () =>
  api.get<CostOptimizationResponse>('/buyer/agent/cost-optimization').then(r => r.data);

export const getBuyerAgentNotifications = () =>
  api.get<BuyerNotificationsResponse>('/buyer/agent/notifications').then(r => r.data);

export const getBuyerAllInsights = () =>
  api.get<BuyerAgentInsightsResponse>('/buyer/agent/insights').then(r => r.data);
