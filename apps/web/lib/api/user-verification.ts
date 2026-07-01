import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface UserVerification {
  id: string;
  userId: string;
  level: string;
  status: string;
  submittedBy: string;
  submitter?: { id: string; email: string; name: string };
  documents: { id: string; documentType: string; status: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewer?: { id: string; name: string };
}

export interface ReputationEvent {
  id: string;
  userId: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReputationSummary {
  userId: string;
  totalEvents: number;
  memberSince: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  verificationLevel: string;
  recentEvents: ReputationEvent[];
}

export function getUserVerifications(params?: { status?: string; cursor?: string; limit?: number }) {
  return apiClient.get<PaginatedResponse<UserVerification>>('/user-verifications', { params }).then(r => r.data);
}

export function getMyUserVerifications() {
  return apiClient.get<UserVerification[]>('/user-verifications/my').then(r => r.data);
}

export function submitUserVerification(data: { level: string; documents: { documentType: string; documentUrl: string }[]; notes?: string }) {
  return apiClient.post<UserVerification>('/user-verifications', data).then(r => r.data);
}

export function reviewUserVerification(id: string, status: string, notes: string) {
  return apiClient.post<UserVerification>(`/user-verifications/${id}/review`, { status, notes }).then(r => r.data);
}

export function getReputationEvents(userId: string) {
  return apiClient.get<ReputationEvent[]>(`/reputation/events/${userId}`).then(r => r.data);
}

export function getReputationSummary(userId: string) {
  return apiClient.get<ReputationSummary>(`/reputation/summary/${userId}`).then(r => r.data);
}
