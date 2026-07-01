import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as crmApi from '@/lib/api/crm';
import type { CreateLeadDto, UpdateLeadDto, QueryLeadParams, CreateFollowUpDto, CreateNoteDto, CreateTaskDto } from '@/lib/api/crm';

export function useLeads(params?: QueryLeadParams) {
  return useQuery({ queryKey: ['crm', 'leads', params], queryFn: () => crmApi.listLeads(params).then(r => r.data) });
}
export function useLead(id: string) {
  return useQuery({ queryKey: ['crm', 'lead', id], queryFn: () => crmApi.getLead(id).then(r => r.data), enabled: !!id });
}
export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: CreateLeadDto) => crmApi.createLead(dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'leads'] }) });
}
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: UpdateLeadDto }) => crmApi.updateLead(id, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }) });
}
export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.deleteLead(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'leads'] }) });
}
export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, companyId }: { id: string; companyId?: string }) => crmApi.convertLead(id, companyId).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }) });
}
export function useMarkLeadLost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => crmApi.markLeadLost(id, reason).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }) });
}
export function useReassignLead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ownerId }: { id: string; ownerId: string }) => crmApi.reassignLead(id, ownerId).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }) });
}
export function useRecalculateLeadScore() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.recalculateLeadScore(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'lead'] }) });
}

export function useFollowUps(leadId: string) {
  return useQuery({ queryKey: ['crm', 'follow-ups', leadId], queryFn: () => crmApi.listFollowUps(leadId).then(r => r.data), enabled: !!leadId });
}
export function useMyFollowUps() {
  return useQuery({ queryKey: ['crm', 'follow-ups', 'my'], queryFn: () => crmApi.getMyFollowUps().then(r => r.data) });
}
export function useOverdueFollowUps() {
  return useQuery({ queryKey: ['crm', 'follow-ups', 'overdue'], queryFn: () => crmApi.getOverdueFollowUps().then(r => r.data) });
}
export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ leadId, dto }: { leadId: string; dto: CreateFollowUpDto }) => crmApi.createFollowUp(leadId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'follow-ups'] }) });
}
export function useCompleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.completeFollowUp(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'follow-ups'] }) });
}

export function useNotes(leadId: string) {
  return useQuery({ queryKey: ['crm', 'notes', leadId], queryFn: () => crmApi.listNotes(leadId).then(r => r.data), enabled: !!leadId });
}
export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ leadId, dto }: { leadId: string; dto: CreateNoteDto }) => crmApi.createNote(leadId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'notes'] }) });
}
export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.deleteNote(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'notes'] }) });
}
export function useTogglePinNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.togglePinNote(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'notes'] }) });
}

export function useTasks(leadId: string) {
  return useQuery({ queryKey: ['crm', 'tasks', leadId], queryFn: () => crmApi.listTasks(leadId).then(r => r.data), enabled: !!leadId });
}
export function useMyTasks() {
  return useQuery({ queryKey: ['crm', 'tasks', 'my'], queryFn: () => crmApi.getMyTasks().then(r => r.data) });
}
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ leadId, dto }: { leadId: string; dto: CreateTaskDto }) => crmApi.createTask(leadId, dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'tasks'] }) });
}
export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.completeTask(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'tasks'] }) });
}

export function useLeadTimeline(leadId: string) {
  return useQuery({ queryKey: ['crm', 'timeline', leadId], queryFn: () => crmApi.getLeadTimeline(leadId).then(r => r.data), enabled: !!leadId });
}
export function useCustomerTimeline(companyId: string, limit?: number) {
  return useQuery({ queryKey: ['crm', 'customer-timeline', companyId], queryFn: () => crmApi.getCustomerTimeline(companyId, limit).then(r => r.data), enabled: !!companyId });
}

export function usePipelineStages() {
  return useQuery({ queryKey: ['crm', 'pipeline-stages'], queryFn: () => crmApi.getPipelineStages().then(r => r.data) });
}
export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (dto: any) => crmApi.createPipelineStage(dto).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'pipeline-stages'] }) });
}
export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => crmApi.deletePipelineStage(id).then(r => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'pipeline-stages'] }) });
}

export function useCrmSearch(q: string) {
  return useQuery({ queryKey: ['crm', 'search', q], queryFn: () => crmApi.searchCrm(q).then(r => r.data), enabled: q.length >= 2 });
}

export function useLeadConversionReport() {
  return useQuery({ queryKey: ['crm', 'report', 'conversion'], queryFn: () => crmApi.getLeadConversionReport().then(r => r.data) });
}
export function useWinRateReport() {
  return useQuery({ queryKey: ['crm', 'report', 'win-rate'], queryFn: () => crmApi.getWinRateReport().then(r => r.data) });
}
export function usePipelineValueReport() {
  return useQuery({ queryKey: ['crm', 'report', 'pipeline-value'], queryFn: () => crmApi.getPipelineValueReport().then(r => r.data) });
}
export function useFollowUpEfficiencyReport() {
  return useQuery({ queryKey: ['crm', 'report', 'follow-up-efficiency'], queryFn: () => crmApi.getFollowUpEfficiencyReport().then(r => r.data) });
}
export function useRmPerformanceReport() {
  return useQuery({ queryKey: ['crm', 'report', 'rm-performance'], queryFn: () => crmApi.getRmPerformanceReport().then(r => r.data) });
}

export function useAdminCrmDashboard() {
  return useQuery({ queryKey: ['crm', 'admin', 'dashboard'], queryFn: () => crmApi.getAdminCrmDashboard().then(r => r.data) });
}
