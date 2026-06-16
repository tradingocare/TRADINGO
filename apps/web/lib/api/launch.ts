import { apiClient } from './client';

export interface LaunchDashboard {
  totalCompanies: number;
  companiesOnboarded: number;
  totalProducts: number;
  activeUsers: number;
  searchVolume: number;
  pageViews: number;
  conversionRate: number;
  checklistProgress: { notStarted: number; inProgress: number; completed: number; verified: number; total: number };
  activeIncidents: number;
  recentIncidents: Incident[];
}

export interface CompanyMetrics {
  total: number;
  byStatus: Record<string, number>;
  avgTrustScore: number;
  byVerificationLevel: Record<string, number>;
  byOnboardingStep: Record<string, number>;
  avgTimeToOnboardDays: number;
  bySubscriptionPlan: Record<string, number>;
}

export interface ProductMetrics {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  avgPrice: number;
  withImages: number;
  withoutImages: number;
  importJobCount: number;
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueSearchers: number;
  topQueries: { query: string; count: number }[];
  zeroResultSearches: number;
  dailyTrend: { date: string; count: number }[];
}

export interface TrafficMetrics {
  totalPageViews: number;
  uniqueVisitors: number;
  byPage: Record<string, number>;
  bySource: Record<string, number>;
  dailyTrend: { date: string; count: number }[];
}

export interface ConversionMetrics {
  totalSignups: number;
  companiesCreated: number;
  productsAdded: number;
  firstOrders: number;
  repeatOrders: number;
  signupToCompanyRate: number;
  companyToProductRate: number;
  productToFirstOrderRate: number;
  firstToRepeatOrderRate: number;
  avgDaysSignupToCompany: number;
  avgDaysCompanyToProduct: number;
  avgDaysProductToFirstOrder: number;
}

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  notes?: string;
  completedAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'DETECTED' | 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactedServices: string[];
  reportedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  updates?: IncidentUpdate[];
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: string;
  createdAt: string;
}

// Dashboard
export function getLaunchDashboard() {
  return apiClient.get<LaunchDashboard>('/launch').then(r => r.data);
}

// Metrics
export function getCompanyMetrics() {
  return apiClient.get<CompanyMetrics>('/launch/metrics/companies').then(r => r.data);
}

export function getProductMetrics() {
  return apiClient.get<ProductMetrics>('/launch/metrics/products').then(r => r.data);
}

export function getSearchMetrics() {
  return apiClient.get<SearchMetrics>('/launch/metrics/search').then(r => r.data);
}

export function getTrafficMetrics() {
  return apiClient.get<TrafficMetrics>('/launch/metrics/traffic').then(r => r.data);
}

export function getConversionMetrics() {
  return apiClient.get<ConversionMetrics>('/launch/metrics/conversion').then(r => r.data);
}

// Checklist
export function getChecklistItems() {
  return apiClient.get<ChecklistItem[]>('/launch/checklist').then(r => r.data);
}

export function getChecklistStatuses() {
  return apiClient.get<{ itemId: string; status: string; notes?: string; completedAt?: string }[]>('/launch/checklist/statuses').then(r => r.data);
}

export function updateChecklistStatus(itemId: string, status: string, notes?: string) {
  return apiClient.patch(`/launch/checklist/${itemId}/status`, { status, notes }).then(r => r.data);
}

export function verifyChecklistItem(itemId: string, notes?: string) {
  return apiClient.post(`/launch/checklist/${itemId}/verify`, { notes }).then(r => r.data);
}

export function getChecklistProgress() {
  return apiClient.get<{ notStarted: number; inProgress: number; completed: number; verified: number; total: number }>('/launch/checklist/progress').then(r => r.data);
}

// Incidents
export function getIncidents(params?: { status?: string; severity?: string; page?: number; limit?: number }) {
  return apiClient.get<Incident[]>('/launch/incidents', { params }).then(r => r.data);
}

export function getActiveIncidents() {
  return apiClient.get<Incident[]>('/launch/incidents/active').then(r => r.data);
}

export function getIncident(id: string) {
  return apiClient.get<Incident>(`/launch/incidents/${id}`).then(r => r.data);
}

export function createIncident(data: { title: string; description: string; severity: string; impactedServices?: string[] }) {
  return apiClient.post<Incident>('/launch/incidents', data).then(r => r.data);
}

export function updateIncidentStatus(id: string, status: string, message: string) {
  return apiClient.patch<Incident>(`/launch/incidents/${id}/status`, { status, message }).then(r => r.data);
}

export function addIncidentUpdate(id: string, data: { message: string; status: string }) {
  return apiClient.post<IncidentUpdate>(`/launch/incidents/${id}/updates`, data).then(r => r.data);
}
