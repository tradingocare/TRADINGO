export class UnifiedFounderDashboardResponse {
  overview: {
    totalRevenue: number;
    todayRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersToday: number;
    orderGrowth30d: number;
    totalUsers: number;
    totalCompanies: number;
    activeRfqs: number;
    pendingVerifications: number;
    openDisputes: number;
  };
  health: {
    overallScore: number;
    grade: string;
    dimensions: HealthDimension[];
    source: string;
  };
  finance: {
    escrowBalance: number;
    pendingSettlements: number;
    commissionEarned: number;
    activeDisputes: number;
    failedSettlements: number;
  };
  enterprise: {
    digitalTwin: Record<string, unknown>;
    healthIndex: Record<string, unknown>;
    predictions: Record<string, unknown>;
  };
  generatedAt: string;
}

export class HealthDimension {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  status: string;
  description?: string;
}

export class FounderHealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  overallScore: number;
  grade: string;
  dimensions: HealthDimension[];
  period: string;
  source: string;
  generatedAt: string;
}

export class HealthQueryDto {
  revenueWeight?: number;
  growthWeight?: number;
  retentionWeight?: number;
  trustWeight?: number;
  marketplaceWeight?: number;
}
