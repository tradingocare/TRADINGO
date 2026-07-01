import api from './client';

export interface CreateLeadDto {
  companyId?: string;
  name: string;
  email?: string;
  mobile?: string;
  source?: string;
  status?: string;
  stageId?: string;
  priority?: string;
  ownerId?: string;
  score?: number;
  estimatedValue?: number;
  description?: string;
  metadata?: Record<string, any>;
}
export interface UpdateLeadDto {
  name?: string;
  email?: string;
  mobile?: string;
  source?: string;
  status?: string;
  stageId?: string;
  priority?: string;
  ownerId?: string;
  score?: number;
  estimatedValue?: number;
  description?: string;
  lostReason?: string;
  metadata?: Record<string, any>;
}
export interface QueryLeadParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  source?: string;
  ownerId?: string;
  stageId?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
export interface CreateFollowUpDto {
  leadId: string;
  title: string;
  description?: string;
  dueDate: string;
  assignedTo?: string;
}
export interface CreateNoteDto {
  content: string;
  isPinned?: boolean;
  mentions?: string[];
  attachments?: string[];
}
export interface CreateTaskDto {
  type: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
}

export function createLead(dto: CreateLeadDto) { return api.post('/crm', dto); }
export function listLeads(params?: QueryLeadParams) { return api.get('/crm', { params }); }
export function getLead(id: string) { return api.get(`/crm/${id}`); }
export function updateLead(id: string, dto: UpdateLeadDto) { return api.patch(`/crm/${id}`, dto); }
export function deleteLead(id: string) { return api.delete(`/crm/${id}`); }
export function convertLead(id: string, companyId?: string) { return api.post(`/crm/${id}/convert`, { companyId }); }
export function markLeadLost(id: string, reason: string) { return api.post(`/crm/${id}/mark-lost`, { reason }); }
export function reassignLead(id: string, ownerId: string) { return api.post(`/crm/${id}/reassign`, { ownerId }); }
export function recalculateLeadScore(id: string) { return api.post(`/crm/${id}/recalculate-score`); }

export function createFollowUp(leadId: string, dto: CreateFollowUpDto) { return api.post(`/crm/${leadId}/follow-ups`, dto); }
export function updateFollowUp(id: string, dto: Partial<CreateFollowUpDto>) { return api.patch(`/crm/follow-ups/${id}`, dto); }
export function completeFollowUp(id: string) { return api.post(`/crm/follow-ups/${id}/complete`); }
export function escalateFollowUp(id: string, escalatedTo: string) { return api.post(`/crm/follow-ups/${id}/escalate`, { escalatedTo }); }
export function listFollowUps(leadId: string) { return api.get(`/crm/${leadId}/follow-ups`); }
export function getMyFollowUps() { return api.get('/crm/follow-ups/my'); }
export function getOverdueFollowUps() { return api.get('/crm/follow-ups/overdue'); }

export function createNote(leadId: string, dto: CreateNoteDto) { return api.post(`/crm/${leadId}/notes`, dto); }
export function updateNote(id: string, dto: Partial<CreateNoteDto>) { return api.patch(`/crm/notes/${id}`, dto); }
export function deleteNote(id: string) { return api.delete(`/crm/notes/${id}`); }
export function togglePinNote(id: string) { return api.post(`/crm/notes/${id}/toggle-pin`); }
export function listNotes(leadId: string) { return api.get(`/crm/${leadId}/notes`); }

export function createTask(leadId: string, dto: CreateTaskDto) { return api.post(`/crm/${leadId}/tasks`, dto); }
export function updateTask(id: string, dto: Partial<CreateTaskDto>) { return api.patch(`/crm/tasks/${id}`, dto); }
export function completeTask(id: string) { return api.post(`/crm/tasks/${id}/complete`); }
export function listTasks(leadId: string) { return api.get(`/crm/${leadId}/tasks`); }
export function getMyTasks() { return api.get('/crm/tasks/my'); }

export function getLeadTimeline(leadId: string) { return api.get(`/crm/${leadId}/timeline`); }
export function getCustomerTimeline(companyId: string, limit?: number) { return api.get(`/crm/company/${companyId}/timeline`, { params: { limit } }); }

export function getPipelineStages() { return api.get('/crm/pipeline-stages'); }
export function createPipelineStage(dto: any) { return api.post('/crm/pipeline-stages', dto); }
export function updatePipelineStage(id: string, dto: any) { return api.patch(`/crm/pipeline-stages/${id}`, dto); }
export function deletePipelineStage(id: string) { return api.delete(`/crm/pipeline-stages/${id}`); }
export function reorderPipelineStages(order: string[]) { return api.post('/crm/pipeline-stages/reorder', { order }); }

export function searchCrm(q: string, limit?: number) { return api.get('/crm/search', { params: { q, limit } }); }

export function getLeadConversionReport() { return api.get('/crm/reports/conversion'); }
export function getWinRateReport() { return api.get('/crm/reports/win-rate'); }
export function getLostReasonsReport() { return api.get('/crm/reports/lost-reasons'); }
export function getPipelineValueReport() { return api.get('/crm/reports/pipeline-value'); }
export function getFollowUpEfficiencyReport() { return api.get('/crm/reports/follow-up-efficiency'); }
export function getRmPerformanceReport() { return api.get('/crm/reports/rm-performance'); }
export function getResponseTimeReport() { return api.get('/crm/reports/response-time'); }

export function getAdminCrmDashboard() { return api.get('/admin/crm/dashboard'); }
