import { apiClient } from './client';
import type { User, PaginatedResponse } from './types';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export function getUsers(params?: GetUsersParams) {
  return apiClient.get<PaginatedResponse<User>>('/users', { params }).then(r => r.data);
}

export function getUser(id: string) {
  return apiClient.get<User>(`/users/${id}`).then(r => r.data);
}

export function updateUser(id: string, data: Partial<User>) {
  return apiClient.patch<User>(`/users/${id}`, data).then(r => r.data);
}
