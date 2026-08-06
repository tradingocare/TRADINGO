export class ConsolidatedHealthDimension {
  name: string;
  founderAiScore: number | null;
  enterpriseScore: number | null;
  consolidatedScore: number;
  weight: number;
  status: 'healthy' | 'monitor' | 'critical';
}

export class HealthSourceBreakdown {
  source: string;
  overallScore: number | null;
  grade: string | null;
  dimensions: { name: string; score: number }[];
}

export class ConsolidatedHealthResponseDto {
  status: 'healthy' | 'degraded' | 'critical';
  overallScore: number;
  grade: string;
  dimensions: ConsolidatedHealthDimension[];
  sources: HealthSourceBreakdown[];
  weights: {
    founderAi: number;
    enterprise: number;
    marketplace: number;
  };
  period: string;
  recommendations: string[];
  generatedAt: string;
}

export class ConsolidatedHealthQueryDto {
  founderAiWeight?: number;
  enterpriseWeight?: number;
  marketplaceWeight?: number;
}
