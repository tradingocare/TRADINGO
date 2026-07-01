import { apiClient } from './client';

export interface TrustScoreResponse {
  score: number;
  factors: Record<string, number> | null;
  updatedAt: string | null;
}

export interface UnifiedScoreResponse extends TrustScoreResponse {
  unifiedScore: number;
  grade: string;
  riskLevel: string;
}

export interface BreakdownItem {
  category: string;
  score: number;
  weight: number;
  contribution: number;
  maxContribution: number;
}

export interface ScoreBreakdown {
  unifiedScore: number;
  grade: string;
  riskLevel: string;
  breakdown: BreakdownItem[];
}

export interface ScoreHistoryEntry {
  id: string;
  score: number;
  factors: Record<string, number> | null;
  createdAt: string;
}

export interface TrustStats {
  totalCompanies: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  highestScore: number;
  lowestScore: number;
  recentRecalculations: number;
}

export function getTrustScore(companyId: string) {
  return apiClient.get<TrustScoreResponse>(`/tradtrust/score/${companyId}`).then(r => r.data);
}

export function getUnifiedScore(companyId: string) {
  return apiClient.get<UnifiedScoreResponse>(`/tradtrust/unified/${companyId}`).then(r => r.data);
}

export function getScoreBreakdown(companyId: string) {
  return apiClient.get<ScoreBreakdown>(`/tradtrust/breakdown/${companyId}`).then(r => r.data);
}

export function getScoreHistory(companyId: string, limit?: number) {
  return apiClient.get<ScoreHistoryEntry[]>(`/tradtrust/history/${companyId}`, { params: { limit } }).then(r => r.data);
}

export function getTrustStats() {
  return apiClient.get<TrustStats>('/tradtrust/stats').then(r => r.data);
}

export function recalculateScore(companyId: string) {
  return apiClient.post<{ companyId: string; score: number }>(`/tradtrust/recalculate/${companyId}`).then(r => r.data);
}

export function recalculateAllScores() {
  return apiClient.post<{ count: number }>('/tradtrust/recalculate-all').then(r => r.data);
}

export function recalculateUserScore(userId: string) {
  return apiClient.post<{ companyId: string; score: number }>(`/tradtrust/recalculate-user/${userId}`).then(r => r.data);
}
