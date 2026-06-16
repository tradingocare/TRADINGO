import { apiClient } from './client';
import type { AnalyticsSummary } from './types';

export interface GetAnalyticsParams {
  periodStart?: string;
  periodEnd?: string;
}

export function getAnalytics(params?: GetAnalyticsParams) {
  return apiClient.get<AnalyticsSummary>('/analytics', { params }).then(r => r.data);
}
