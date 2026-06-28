import { apiClient } from './client';

export const smartQuoteApi = {
  create(companyId: string, rfqId: string, data: any) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes`, data).then(r => r.data);
  },
  list(companyId: string, rfqId: string) {
    return apiClient.get(`/companies/${companyId}/rfq/${rfqId}/quotes`).then(r => r.data);
  },
  getById(companyId: string, rfqId: string, quoteId: string) {
    return apiClient.get(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}`).then(r => r.data);
  },
  update(companyId: string, rfqId: string, quoteId: string, data: any) {
    return apiClient.patch(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}`, data).then(r => r.data);
  },
  submit(companyId: string, rfqId: string, quoteId: string) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/submit`).then(r => r.data);
  },
  withdraw(companyId: string, rfqId: string, quoteId: string, reason?: string) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/withdraw`, { reason }).then(r => r.data);
  },
  accept(companyId: string, rfqId: string, quoteId: string) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/accept`).then(r => r.data);
  },
  reject(companyId: string, rfqId: string, quoteId: string, reason?: string) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/reject`, { reason }).then(r => r.data);
  },
  revise(companyId: string, rfqId: string, quoteId: string, data: any) {
    return apiClient.post(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/revise`, data).then(r => r.data);
  },
};
