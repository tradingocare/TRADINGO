import { apiClient } from './client';

export interface BetaInvite {
  id: string;
  email: string;
  companyName?: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedById?: string;
  companyId?: string;
  programId?: string;
  message?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface FeedbackEntry {
  id: string;
  type: 'BUG' | 'FEATURE' | 'NPS' | 'GENERAL';
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  score?: number;
  comment?: string;
  businessImpact?: string;
  status: 'NEW' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  companyId?: string;
  userId?: string;
  page?: string;
  createdAt: string;
}

export interface UsageEvent {
  id: string;
  companyId: string;
  eventName: string;
  category?: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorEvent {
  id: string;
  companyId?: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  page?: string;
  action?: string;
  resolved: boolean;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  companyId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportTicketMessage[];
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  attachments?: Record<string, unknown>;
  createdAt: string;
}

export interface BetaMetrics {
  id: string;
  companyId: string;
  metricName: string;
  metricValue: number;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface OnboardingStatus {
  id: string;
  companyId: string;
  onboardingStep: string;
  onboardingCompletedAt?: string;
  goLiveAt?: string;
  welcomeEmailSent: boolean;
  setupProgress: number;
}

export interface OnboardingProgress {
  currentStep: string;
  progress: number;
  completedSteps: string[];
  totalSteps: number;
}

export interface BetaDashboard {
  onboarding: OnboardingProgress | null;
  invite: BetaInvite | null;
  recentErrors: ErrorEvent[];
  recentTickets: SupportTicket[];
  usageStats: { eventName: string; count: number }[];
  metrics: { name: string; value: number }[];
  feedbackCounts: { total: number; bugs: number; features: number; nps: number };
}

// Invites
export function getBetaInvites() {
  return apiClient.get<BetaInvite[]>('/beta-invites').then(r => r.data);
}

export function getBetaInviteStats() {
  return apiClient.get<{ pending: number; accepted: number; expired: number; revoked: number; total: number }>('/beta-invites/stats').then(r => r.data);
}

export function createBetaInvite(data: { email: string; companyName?: string; message?: string }) {
  return apiClient.post<BetaInvite>('/beta-invites', data).then(r => r.data);
}

export function acceptBetaInvite(token: string, companyId: string) {
  return apiClient.post<BetaInvite>(`/beta-invites/${token}/accept`, { companyId }).then(r => r.data);
}

export function revokeBetaInvite(id: string) {
  return apiClient.patch<BetaInvite>(`/beta-invites/${id}/revoke`).then(r => r.data);
}

// Feedback
export function submitFeedback(data: {
  type: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  score?: number;
  comment?: string;
  businessImpact?: string;
  page?: string;
}) {
  return apiClient.post<FeedbackEntry>('/beta-feedback', data).then(r => r.data);
}

export function getBetaFeedback(params?: { status?: string; type?: string; page?: number; limit?: number }) {
  return apiClient.get<FeedbackEntry[]>('/beta-feedback', { params }).then(r => r.data);
}

export function getBetaFeedbackStats() {
  return apiClient.get<{ total: number; bugs: number; features: number; nps: number; npsAverage?: number }>('/beta-feedback/stats').then(r => r.data);
}

export function updateFeedbackStatus(id: string, status: string) {
  return apiClient.patch<FeedbackEntry>(`/beta-feedback/${id}/status`, { status }).then(r => r.data);
}

// Usage Tracking
export function trackEvent(data: { eventName: string; category?: string; properties?: Record<string, unknown>; sessionId?: string }) {
  return apiClient.post('/beta-tracking/events', data).then(r => r.data);
}

export function getUsageStats(params?: { period?: string }) {
  return apiClient.get<{ category: string; count: number }[]>('/beta-tracking/events/stats', { params }).then(r => r.data);
}

export function getTopEvents(limit = 10) {
  return apiClient.get<{ eventName: string; count: number }[]>('/beta-tracking/events/top', { params: { limit } }).then(r => r.data);
}

// Error Tracking
export function reportError(data: {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  page?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiClient.post('/beta-tracking/errors', data).then(r => r.data);
}

export function getBetaErrors(params?: { type?: string; resolved?: boolean; page?: number; limit?: number }) {
  return apiClient.get<ErrorEvent[]>('/beta-tracking/errors', { params }).then(r => r.data);
}

export function getBetaErrorStats() {
  return apiClient.get<{ total: number; resolved: number; byType: Record<string, number> }>('/beta-tracking/errors/stats').then(r => r.data);
}

export function resolveError(id: string) {
  return apiClient.patch(`/beta-tracking/errors/${id}/resolve`).then(r => r.data);
}

// Onboarding
export function getOnboardingStatus() {
  return apiClient.get<OnboardingStatus>('/beta-onboarding/status').then(r => r.data);
}

export function advanceOnboardingStep() {
  return apiClient.post<OnboardingProgress>('/beta-onboarding/advance').then(r => r.data);
}

export function getProductImportGuide() {
  return apiClient.get<{ status: string; steps: { label: string; completed: boolean; action: string }[] }>('/beta-onboarding/product-import').then(r => r.data);
}

export function getRfqGuide() {
  return apiClient.get<{ status: string; steps: { label: string; completed: boolean; action: string }[] }>('/beta-onboarding/rfq').then(r => r.data);
}

// Support
export function createSupportTicket(data: { subject: string; description: string; category?: string; priority?: string }) {
  return apiClient.post<SupportTicket>('/beta-support/tickets', data).then(r => r.data);
}

export function getSupportTickets(params?: { status?: string; page?: number; limit?: number }) {
  return apiClient.get<SupportTicket[]>('/beta-support/tickets', { params }).then(r => r.data);
}

export function getSupportTicket(id: string) {
  return apiClient.get<SupportTicket>(`/beta-support/tickets/${id}`).then(r => r.data);
}

export function addTicketMessage(ticketId: string, data: { message: string; attachments?: Record<string, unknown>[] }) {
  return apiClient.post<SupportTicketMessage>(`/beta-support/tickets/${ticketId}/messages`, data).then(r => r.data);
}

export function updateTicketStatus(ticketId: string, status: string) {
  return apiClient.patch<SupportTicket>(`/beta-support/tickets/${ticketId}/status`, { status }).then(r => r.data);
}

// Dashboard & Metrics
export function getBetaDashboard() {
  return apiClient.get<BetaDashboard>('/beta-dashboard').then(r => r.data);
}

export function getBetaMetrics(names?: string[]) {
  return apiClient.get<BetaMetrics[]>('/beta-dashboard/metrics', { params: { names } }).then(r => r.data);
}

export function recordBetaMetric(data: { metricName: string; metricValue: number; metadata?: Record<string, unknown> }) {
  return apiClient.post<BetaMetrics>('/beta-dashboard/metrics', data).then(r => r.data);
}
