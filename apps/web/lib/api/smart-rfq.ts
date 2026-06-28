import { apiClient } from './client';

export interface SmartRfqParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
}

export const smartRfqApi = {
  create(data: any) { return apiClient.post('/smart-rfq', data).then(r => r.data); },
  list(params?: SmartRfqParams) { return apiClient.get('/smart-rfq', { params }).then(r => r.data); },
  getById(id: string) { return apiClient.get(`/smart-rfq/${id}`).then(r => r.data); },
  duplicate(id: string) { return apiClient.post(`/smart-rfq/${id}/duplicate`).then(r => r.data); },
  findSuppliers(id: string) { return apiClient.get(`/smart-rfq/${id}/suppliers`).then(r => r.data); },
  getMatchingStats() { return apiClient.get('/smart-rfq/near-to-far/stats').then(r => r.data); },
  seller: {
    incoming(params?: SmartRfqParams) { return apiClient.get('/smart-rfq/seller/incoming', { params }).then(r => r.data); },
    accept(rfqId: string) { return apiClient.post(`/smart-rfq/seller/${rfqId}/accept`).then(r => r.data); },
    decline(rfqId: string, reason?: string) { return apiClient.post(`/smart-rfq/seller/${rfqId}/decline`, { reason }).then(r => r.data); },
    stats() { return apiClient.get('/smart-rfq/seller/stats').then(r => r.data); },
  },
  admin: {
    overview() { return apiClient.get('/smart-rfq/admin/overview').then(r => r.data); },
    list(params?: SmartRfqParams & { limit?: number; offset?: number }) { return apiClient.get('/smart-rfq/admin/rfqs', { params }).then(r => r.data); },
    flagged(params?: { limit?: number; offset?: number }) { return apiClient.get('/smart-rfq/admin/flagged', { params }).then(r => r.data); },
    auditTrail(params?: { limit?: number; offset?: number }) { return apiClient.get('/smart-rfq/admin/audit-trail', { params }).then(r => r.data); },
  },
};
