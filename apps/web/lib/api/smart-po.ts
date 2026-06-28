import { apiClient } from './client';

export const smartPoApi = {
  generate(negotiationId: string) {
    return apiClient.post(`/smart-po/${negotiationId}/generate`).then(r => r.data);
  },
  confirm(poId: string) {
    return apiClient.post(`/smart-po/${poId}/confirm`).then(r => r.data);
  },
  markSellerPending(poId: string) {
    return apiClient.post(`/smart-po/${poId}/seller-pending`).then(r => r.data);
  },
  accept(poId: string) {
    return apiClient.post(`/smart-po/${poId}/accept`).then(r => r.data);
  },
  reject(poId: string, reason?: string) {
    return apiClient.post(`/smart-po/${poId}/reject`, { reason }).then(r => r.data);
  },
  cancel(poId: string, reason?: string) {
    return apiClient.post(`/smart-po/${poId}/cancel`, { reason }).then(r => r.data);
  },
  requestRevision(poId: string, notes: string) {
    return apiClient.post(`/smart-po/${poId}/request-revision`, { notes }).then(r => r.data);
  },
  revise(poId: string, data: Record<string, any>) {
    return apiClient.patch(`/smart-po/${poId}`, data).then(r => r.data);
  },
  lock(poId: string) {
    return apiClient.post(`/smart-po/${poId}/lock`).then(r => r.data);
  },
  list(params?: { status?: string }) {
    return apiClient.get('/smart-po', { params }).then(r => r.data);
  },
  getById(id: string) {
    return apiClient.get(`/smart-po/${id}`).then(r => r.data);
  },
  getVersions(id: string) {
    return apiClient.get(`/smart-po/${id}/versions`).then(r => r.data);
  },
  getTimeline(id: string) {
    return apiClient.get(`/smart-po/${id}/timeline`).then(r => r.data);
  },
  getPdfUrl(id: string) {
    return `/smart-po/${id}/pdf`;
  },
  // Admin
  getAdminOverview() {
    return apiClient.get('/smart-po/admin/overview').then(r => r.data);
  },
  getAdminPos(params?: { status?: string; limit?: number; offset?: number }) {
    return apiClient.get('/smart-po/admin/orders', { params }).then(r => r.data);
  },
  getAdminFlagged(params?: { limit?: number; offset?: number }) {
    return apiClient.get('/smart-po/admin/flagged', { params }).then(r => r.data);
  },
  getAdminAudit(params?: { limit?: number; offset?: number }) {
    return apiClient.get('/smart-po/admin/audit', { params }).then(r => r.data);
  },
};
