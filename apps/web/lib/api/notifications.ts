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
