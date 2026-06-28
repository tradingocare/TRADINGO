import { apiClient } from './client';

export const smartNegotiationApi = {
  start(quoteId: string, data?: { notes?: string }) {
    return apiClient.post(`/smart-negotiation/${quoteId}/start`, data).then(r => r.data);
  },
  counter(negotiationId: string, data: Record<string, any>) {
    return apiClient.post(`/smart-negotiation/${negotiationId}/counter`, data).then(r => r.data);
  },
  accept(negotiationId: string) {
    return apiClient.post(`/smart-negotiation/${negotiationId}/accept`).then(r => r.data);
  },
  reject(negotiationId: string, reason?: string) {
    return apiClient.post(`/smart-negotiation/${negotiationId}/reject`, { reason }).then(r => r.data);
  },
  cancel(negotiationId: string, reason?: string) {
    return apiClient.post(`/smart-negotiation/${negotiationId}/cancel`, { reason }).then(r => r.data);
  },
  list(params?: { status?: string }) {
    return apiClient.get('/smart-negotiation', { params }).then(r => r.data);
  },
  getById(id: string) {
    return apiClient.get(`/smart-negotiation/${id}`).then(r => r.data);
  },
  getVersions(id: string) {
    return apiClient.get(`/smart-negotiation/${id}/versions`).then(r => r.data);
  },
  getTimeline(id: string) {
    return apiClient.get(`/smart-negotiation/${id}/timeline`).then(r => r.data);
  },
  // Admin
  getAdminOverview() {
    return apiClient.get('/smart-negotiation/admin/overview').then(r => r.data);
  },
  getAdminNegotiations(params?: { status?: string; limit?: number; offset?: number }) {
    return apiClient.get('/smart-negotiation/admin/negotiations', { params }).then(r => r.data);
  },
  getAdminFlagged(params?: { limit?: number; offset?: number }) {
    return apiClient.get('/smart-negotiation/admin/flagged', { params }).then(r => r.data);
  },
  getAdminAudit(params?: { limit?: number; offset?: number }) {
    return apiClient.get('/smart-negotiation/admin/audit', { params }).then(r => r.data);
  },
};
