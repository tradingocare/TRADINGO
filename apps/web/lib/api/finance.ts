import api from './client';

export interface SetCreditLimitDto { creditLimit: number; notes?: string }
export interface UpdateCreditStatusDto { status: string; reason?: string }
export interface UpdateRiskLevelDto { riskLevel: string; reason?: string }
export interface RequestCreditApprovalDto { requestType: string; requestedLimit?: number; reason: string }
export interface CreateCreditNoteDto { invoiceId: string; reason: string; subtotal: number; taxAmount?: number; totalAmount: number; notes?: string; items?: Array<{ description: string; hsnSacCode?: string; quantity?: number; unitPrice: number; amount: number }> }
export interface CreateDebitNoteDto extends CreateCreditNoteDto {}
export interface CreateCollectionNoteDto { actionType: string; content: string; contactedPerson?: string; outcome?: string; followUpAt?: string }

export function listCredits(params?: any) { return api.get('/finance/credit', { params }); }
export function getCredit(companyId: string) { return api.get(`/finance/credit/${companyId}`); }
export function getCreditUtilization() { return api.get('/finance/credit/utilization'); }
export function setCreditLimit(companyId: string, dto: SetCreditLimitDto) { return api.post(`/finance/credit/${companyId}/set-limit`, dto); }
export function updateCreditStatus(companyId: string, dto: UpdateCreditStatusDto) { return api.post(`/finance/credit/${companyId}/status`, dto); }
export function updateRiskLevel(companyId: string, dto: UpdateRiskLevelDto) { return api.post(`/finance/credit/${companyId}/risk-level`, dto); }
export function getCreditHistory(companyId: string) { return api.get(`/finance/credit/${companyId}/history`); }
export function requestCreditApproval(companyId: string, dto: RequestCreditApprovalDto) { return api.post(`/finance/credit/${companyId}/approval-request`, dto); }
export function getCreditApprovals(companyId: string) { return api.get(`/finance/credit/${companyId}/approvals`); }
export function listCreditApprovals(params?: any) { return api.get('/finance/credit-approvals', { params }); }
export function approveCreditApproval(id: string, notes?: string) { return api.post(`/finance/credit-approvals/${id}/approve`, { notes }); }
export function rejectCreditApproval(id: string, reason: string) { return api.post(`/finance/credit-approvals/${id}/reject`, { reason }); }

export function getCollectionsSummary() { return api.get('/finance/collections/summary'); }
export function getAgingReport() { return api.get('/finance/collections/aging'); }
export function listOverdueCompanies(params?: any) { return api.get('/finance/collections/overdue-companies', { params }); }
export function createCollectionNote(companyId: string, dto: CreateCollectionNoteDto) { return api.post(`/finance/collections/${companyId}/notes`, dto); }
export function listCollectionNotes(companyId: string) { return api.get(`/finance/collections/${companyId}/notes`); }
export function getCollectionTimeline(companyId: string) { return api.get(`/finance/collections/${companyId}/timeline`); }

export function listCreditNotes(params?: any) { return api.get('/finance/credit-notes', { params }); }
export function createCreditNote(dto: CreateCreditNoteDto) { return api.post('/finance/credit-notes', dto); }
export function issueCreditNote(id: string) { return api.post(`/finance/credit-notes/${id}/issue`); }
export function cancelCreditNote(id: string, reason: string) { return api.post(`/finance/credit-notes/${id}/cancel`, { reason }); }
export function getCreditNoteGstSummary(startDate?: string, endDate?: string) { return api.get('/finance/credit-notes/gst-summary', { params: { startDate, endDate } }); }

export function listDebitNotes(params?: any) { return api.get('/finance/debit-notes', { params }); }
export function createDebitNote(dto: CreateDebitNoteDto) { return api.post('/finance/debit-notes', dto); }
export function issueDebitNote(id: string) { return api.post(`/finance/debit-notes/${id}/issue`); }
export function cancelDebitNote(id: string, reason: string) { return api.post(`/finance/debit-notes/${id}/cancel`, { reason }); }

export function getFinanceDashboard(params?: any) { return api.get('/finance/dashboard', { params }); }
export function getCashFlow(params?: any) { return api.get('/finance/dashboard/cash-flow', { params }); }

export function getRmFinanceDashboard() { return api.get('/finance/rm/dashboard'); }
export function getRmFinancePerformance() { return api.get('/finance/rm/performance'); }
