import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '@/lib/api/finance';

export function useCredits(params?: any) { return useQuery({ queryKey: ['finance', 'credits', params], queryFn: () => financeApi.listCredits(params).then(r => r.data) }); }
export function useCredit(companyId: string) { return useQuery({ queryKey: ['finance', 'credit', companyId], queryFn: () => financeApi.getCredit(companyId).then(r => r.data), enabled: !!companyId }); }
export function useCreditUtilization() { return useQuery({ queryKey: ['finance', 'credit', 'utilization'], queryFn: () => financeApi.getCreditUtilization().then(r => r.data) }); }
export function useSetCreditLimit() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ companyId, dto }: { companyId: string; dto: financeApi.SetCreditLimitDto }) => financeApi.setCreditLimit(companyId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit'] }) }); }
export function useUpdateCreditStatus() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ companyId, dto }: { companyId: string; dto: financeApi.UpdateCreditStatusDto }) => financeApi.updateCreditStatus(companyId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit'] }) }); }
export function useUpdateRiskLevel() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ companyId, dto }: { companyId: string; dto: financeApi.UpdateRiskLevelDto }) => financeApi.updateRiskLevel(companyId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit'] }) }); }
export function useCreditHistory(companyId: string) { return useQuery({ queryKey: ['finance', 'credit', companyId, 'history'], queryFn: () => financeApi.getCreditHistory(companyId).then(r => r.data), enabled: !!companyId }); }
export function useCreditApprovals(companyId: string) { return useQuery({ queryKey: ['finance', 'credit', companyId, 'approvals'], queryFn: () => financeApi.getCreditApprovals(companyId).then(r => r.data), enabled: !!companyId }); }
export function useAllCreditApprovals(params?: any) { return useQuery({ queryKey: ['finance', 'credit-approvals', params], queryFn: () => financeApi.listCreditApprovals(params).then(r => r.data) }); }
export function useApproveCreditApproval() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, notes }: { id: string; notes?: string }) => financeApi.approveCreditApproval(id, notes).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit-approvals'] }) }); }
export function useRejectCreditApproval() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => financeApi.rejectCreditApproval(id, reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit-approvals'] }) }); }

export function useCollectionsSummary() { return useQuery({ queryKey: ['finance', 'collections', 'summary'], queryFn: () => financeApi.getCollectionsSummary().then(r => r.data) }); }
export function useAgingReport() { return useQuery({ queryKey: ['finance', 'collections', 'aging'], queryFn: () => financeApi.getAgingReport().then(r => r.data) }); }
export function useOverdueCompanies(params?: any) { return useQuery({ queryKey: ['finance', 'collections', 'overdue', params], queryFn: () => financeApi.listOverdueCompanies(params).then(r => r.data) }); }
export function useCollectionNotes(companyId: string) { return useQuery({ queryKey: ['finance', 'collections', companyId, 'notes'], queryFn: () => financeApi.listCollectionNotes(companyId).then(r => r.data), enabled: !!companyId }); }
export function useCreateCollectionNote() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ companyId, dto }: { companyId: string; dto: financeApi.CreateCollectionNoteDto }) => financeApi.createCollectionNote(companyId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'collections'] }) }); }
export function useCollectionTimeline(companyId: string) { return useQuery({ queryKey: ['finance', 'collections', companyId, 'timeline'], queryFn: () => financeApi.getCollectionTimeline(companyId).then(r => r.data), enabled: !!companyId }); }

export function useCreditNotes(params?: any) { return useQuery({ queryKey: ['finance', 'credit-notes', params], queryFn: () => financeApi.listCreditNotes(params).then(r => r.data) }); }
export function useCreateCreditNote() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: financeApi.CreateCreditNoteDto) => financeApi.createCreditNote(dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit-notes'] }) }); }
export function useIssueCreditNote() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeApi.issueCreditNote(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit-notes'] }) }); }
export function useCancelCreditNote() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => financeApi.cancelCreditNote(id, reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'credit-notes'] }) }); }
export function useCreditNoteGstSummary(startDate?: string, endDate?: string) { return useQuery({ queryKey: ['finance', 'credit-notes', 'gst', startDate, endDate], queryFn: () => financeApi.getCreditNoteGstSummary(startDate, endDate).then(r => r.data) }); }

export function useDebitNotes(params?: any) { return useQuery({ queryKey: ['finance', 'debit-notes', params], queryFn: () => financeApi.listDebitNotes(params).then(r => r.data) }); }
export function useCreateDebitNote() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: financeApi.CreateDebitNoteDto) => financeApi.createDebitNote(dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'debit-notes'] }) }); }
export function useIssueDebitNote() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => financeApi.issueDebitNote(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'debit-notes'] }) }); }
export function useCancelDebitNote() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => financeApi.cancelDebitNote(id, reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'debit-notes'] }) }); }

export function useFinanceDashboard(params?: any) { return useQuery({ queryKey: ['finance', 'dashboard', params], queryFn: () => financeApi.getFinanceDashboard(params).then(r => r.data) }); }
export function useCashFlow(params?: any) { return useQuery({ queryKey: ['finance', 'cash-flow', params], queryFn: () => financeApi.getCashFlow(params).then(r => r.data) }); }

export function useRmFinanceDashboard() { return useQuery({ queryKey: ['finance', 'rm', 'dashboard'], queryFn: () => financeApi.getRmFinanceDashboard().then(r => r.data) }); }
export function useRmFinancePerformance() { return useQuery({ queryKey: ['finance', 'rm', 'performance'], queryFn: () => financeApi.getRmFinancePerformance().then(r => r.data) }); }
