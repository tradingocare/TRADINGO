import { apiClient } from './client';
import type { Notification, PaginatedResponse } from './types';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
}

export function getNotifications(params?: GetNotificationsParams) {
  return apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }).then(r => r.data);
}

export function markAsRead(id: string) {
  return apiClient.patch<Notification>(`/notifications/${id}/read`).then(r => r.data);
}

export function markAllAsRead() {
  return apiClient.post('/notifications/read-all').then(r => r.data);
}

// ─── Newsletter Subscribers ──────────────────────────────

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  companyId?: string;
  status: string;
  subscribedAt: string;
  metadata?: Record<string, any>;
}

export async function subscribe(dto: { email: string; name?: string; companyId?: string }) {
  return apiClient.post('/notifications/newsletter/subscribe', dto).then(r => r.data);
}
export async function unsubscribe(email: string) {
  return apiClient.post('/notifications/newsletter/unsubscribe', { email }).then(r => r.data);
}
export async function listSubscribers(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return apiClient.get('/notifications/newsletter/subscribers', { params }).then(r => r.data);
}
export async function getSubscriberStats() {
  return apiClient.get('/notifications/newsletter/subscribers/stats').then(r => r.data);
}

// ─── Newsletter Campaigns ────────────────────────────────

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

export async function createNewsletterCampaign(dto: { name: string; subject: string; body: string; template?: string; scheduledAt?: string }) {
  return apiClient.post('/notifications/newsletter/campaigns', dto).then(r => r.data);
}
export async function listNewsletterCampaigns(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return apiClient.get('/notifications/newsletter/campaigns', { params }).then(r => r.data);
}
export async function getNewsletterCampaign(id: string) {
  return apiClient.get(`/notifications/newsletter/campaigns/${id}`).then(r => r.data);
}
export async function updateNewsletterCampaign(id: string, dto: Partial<{ name: string; subject: string; body: string; template: string; scheduledAt: string }>) {
  return apiClient.put(`/notifications/newsletter/campaigns/${id}`, dto).then(r => r.data);
}
export async function sendNewsletterCampaign(id: string, dto?: { userIds?: string[]; subject?: string }) {
  return apiClient.post(`/notifications/newsletter/campaigns/${id}/send`, dto).then(r => r.data);
}

// ─── Marketing Workflows ─────────────────────────────────

export interface WorkflowAction {
  type: string;
  [key: string]: unknown;
}
export interface MarketingWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  status: string;
  runCount: number;
  createdAt: string;
  _count?: { logs: number };
}

export async function createWorkflow(dto: { name: string; description?: string; trigger: string; conditions?: Record<string, unknown>; actions: Record<string, unknown>[] }) {
  return apiClient.post('/notifications/workflows', dto).then(r => r.data);
}
export async function listWorkflows(params?: { trigger?: string; status?: string; page?: number; limit?: number }) {
  return apiClient.get('/notifications/workflows', { params }).then(r => r.data);
}
export async function getWorkflow(id: string) {
  return apiClient.get(`/notifications/workflows/${id}`).then(r => r.data);
}
export async function updateWorkflow(id: string, dto: Partial<{ name: string; description: string; trigger: string; status: string; conditions: Record<string, unknown>; actions: Record<string, unknown>[] }>) {
  return apiClient.put(`/notifications/workflows/${id}`, dto).then(r => r.data);
}
export async function deleteWorkflow(id: string) {
  return apiClient.delete(`/notifications/workflows/${id}`).then(r => r.data);
}
export async function executeWorkflow(id: string, triggerId: string, context: Record<string, unknown>) {
  return apiClient.post(`/notifications/workflows/${id}/execute`, { triggerId, context }).then(r => r.data);
}
export async function getWorkflowStats() {
  return apiClient.get('/notifications/workflows/stats').then(r => r.data);
}
