export class KpiCorrelationDto {
  kpi1: string;
  kpi1Name: string;
  kpi2: string;
  kpi2Name: string;
  correlationCoefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  lag: number;
  sampleSize: number;
  description: string;
}

export class AllCorrelationsResponseDto {
  correlations: KpiCorrelationDto[];
  total: number;
  generatedAt: string;
}

export class KpiCorrelationsResponseDto {
  kpiId: string;
  kpiName: string;
  correlations: KpiCorrelationDto[];
  total: number;
  generatedAt: string;
}

export class CorrelationQueryDto {
  kpiId?: string;
  minStrength?: 'strong' | 'moderate' | 'weak';
  limit?: number;
}
