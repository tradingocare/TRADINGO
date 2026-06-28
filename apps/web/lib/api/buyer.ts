import { apiClient } from './client';

export const buyerApi = {
  dashboard: {
    get() { return apiClient.get('/buyer/dashboard').then(r => r.data); },
  },
  savedSuppliers: {
    list() { return apiClient.get('/buyer/saved-suppliers').then(r => r.data); },
    save(companyId: string, notes?: string, tags?: string[]) { return apiClient.post('/buyer/saved-suppliers', { companyId, notes, tags }).then(r => r.data); },
    update(id: string, data: { notes?: string; tags?: string[] }) { return apiClient.patch(`/buyer/saved-suppliers/${id}`, data).then(r => r.data); },
    remove(id: string) { return apiClient.delete(`/buyer/saved-suppliers/${id}`).then(r => r.data); },
    check(companyId: string) { return apiClient.get(`/buyer/saved-suppliers/check/${companyId}`).then(r => r.data); },
  },
  requirements: {
    list(status?: string) { return apiClient.get('/buyer/requirements', { params: { status } }).then(r => r.data); },
    get(id: string) { return apiClient.get(`/buyer/requirements/${id}`).then(r => r.data); },
    create(data: any) { return apiClient.post('/buyer/requirements', data).then(r => r.data); },
    update(id: string, data: any) { return apiClient.patch(`/buyer/requirements/${id}`, data).then(r => r.data); },
    remove(id: string) { return apiClient.delete(`/buyer/requirements/${id}`).then(r => r.data); },
    addItem(id: string, data: any) { return apiClient.post(`/buyer/requirements/${id}/items`, data).then(r => r.data); },
    updateItem(id: string, itemId: string, data: any) { return apiClient.patch(`/buyer/requirements/${id}/items/${itemId}`, data).then(r => r.data); },
    removeItem(id: string, itemId: string) { return apiClient.delete(`/buyer/requirements/${id}/items/${itemId}`).then(r => r.data); },
  },
  notifications: {
    list(type?: string, limit?: number, offset?: number) { return apiClient.get('/buyer/notifications', { params: { type, limit, offset } }).then(r => r.data); },
    unreadCount() { return apiClient.get('/buyer/notifications/unread-count').then(r => r.data); },
    markRead(id: string) { return apiClient.patch(`/buyer/notifications/${id}/read`).then(r => r.data); },
    markAllRead() { return apiClient.post('/buyer/notifications/mark-all-read').then(r => r.data); },
  },
  downloads: {
    list(limit?: number, offset?: number) { return apiClient.get('/buyer/downloads', { params: { limit, offset } }).then(r => r.data); },
    create(data: any) { return apiClient.post('/buyer/downloads', data).then(r => r.data); },
  },
  analytics: {
    overview() { return apiClient.get('/buyer/analytics/overview').then(r => r.data); },
    spending() { return apiClient.get('/buyer/analytics/spending').then(r => r.data); },
    categories() { return apiClient.get('/buyer/analytics/top-products').then(r => r.data); },
  },
};
