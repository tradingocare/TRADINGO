export class KpiDefinition {
  id: string;
  name: string;
  domain: string;
  source: string;
  unit: string;
  description: string;
}

export class KpiValue {
  id: string;
  name: string;
  domain: string;
  source: string;
  unit: string;
  description: string;
  currentValue: number | null;
  previousValue: number | null;
  change: number | null;
  changePercent: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  trend: 'up' | 'down' | 'stable' | 'unknown';
  updatedAt: string;
}

export class KpiCatalogResponse {
  kpis: KpiValue[];
  total: number;
  byDomain: Record<string, number>;
  generatedAt: string;
}

export class KpiSearchQueryDto {
  domain?: string;
  search?: string;
  status?: string;
}

export class KpiDetailResponse {
  kpi: KpiValue;
  history: { period: string; value: number; change: number }[];
  relatedKpis: { id: string; name: string; correlation: number }[];
  generatedAt: string;
}
