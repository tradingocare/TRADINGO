import { apiClient } from './client';

export const communicationApi = {
  conversations: {
    list(params?: { source?: string; archived?: boolean }) {
      return apiClient.get('/communication/conversations', { params }).then(r => r.data);
    },
    get(id: string) { return apiClient.get(`/communication/conversations/${id}`).then(r => r.data); },
    create(data: any) { return apiClient.post('/communication/conversations', data).then(r => r.data); },
    archive(id: string) { return apiClient.patch(`/communication/conversations/${id}/archive`).then(r => r.data); },
    mute(id: string, muted: boolean) { return apiClient.patch(`/communication/conversations/${id}/mute`, { muted }).then(r => r.data); },
    pin(id: string, pinned: boolean) { return apiClient.patch(`/communication/conversations/${id}/pin`, { pinned }).then(r => r.data); },
    updateNotes(id: string, notes: string) { return apiClient.patch(`/communication/conversations/${id}/notes`, { notes }).then(r => r.data); },
    addParticipant(id: string, data: { companyId: string; userId: string }) { return apiClient.post(`/communication/conversations/${id}/participants`, data).then(r => r.data); },
    removeParticipant(id: string, participantId: string) { return apiClient.delete(`/communication/conversations/${id}/participants/${participantId}`).then(r => r.data); },
    getAuditLog(id: string) { return apiClient.get(`/communication/conversations/${id}/audit-log`).then(r => r.data); },
  },
  messages: {
    list(conversationId: string, params?: { limit?: number; offset?: number }) {
      return apiClient.get(`/communication/conversations/${conversationId}/messages`, { params }).then(r => r.data);
    },
    send(conversationId: string, data: { type?: string; content?: string; replyToId?: string; attachments?: any[] }) {
      return apiClient.post(`/communication/conversations/${conversationId}/messages`, data).then(r => r.data);
    },
    markRead(conversationId: string) { return apiClient.post(`/communication/conversations/${conversationId}/messages/read`).then(r => r.data); },
    delete(conversationId: string, messageId: string) { return apiClient.delete(`/communication/conversations/${conversationId}/messages/${messageId}`).then(r => r.data); },
    report(conversationId: string, messageId: string, data: { reason: string; description?: string }) {
      return apiClient.post(`/communication/conversations/${conversationId}/messages/${messageId}/report`, data).then(r => r.data);
    },
    unreadCount() { return apiClient.get('/communication/unread-count').then(r => r.data); },
  },
  labels: {
    list() { return apiClient.get('/communication/labels').then(r => r.data); },
    create(data: { name: string; color?: string }) { return apiClient.post('/communication/labels', data).then(r => r.data); },
    update(id: string, data: { name?: string; color?: string }) { return apiClient.patch(`/communication/labels/${id}`, data).then(r => r.data); },
    delete(id: string) { return apiClient.delete(`/communication/labels/${id}`).then(r => r.data); },
    assign(conversationId: string, labelId: string) { return apiClient.post(`/communication/conversations/${conversationId}/labels/${labelId}`).then(r => r.data); },
    remove(conversationId: string, labelId: string) { return apiClient.delete(`/communication/conversations/${conversationId}/labels/${labelId}`).then(r => r.data); },
  },
  templates: {
    list(category?: string) { return apiClient.get('/communication/templates', { params: { category } }).then(r => r.data); },
    create(data: { title: string; content: string; category?: string; isShared?: boolean }) { return apiClient.post('/communication/templates', data).then(r => r.data); },
    update(id: string, data: any) { return apiClient.patch(`/communication/templates/${id}`, data).then(r => r.data); },
    delete(id: string) { return apiClient.delete(`/communication/templates/${id}`).then(r => r.data); },
  },
  moderation: {
    reports(params?: { status?: string; limit?: number; offset?: number }) {
      return apiClient.get('/admin/communication/reports', { params }).then(r => r.data);
    },
    stats() { return apiClient.get('/admin/communication/stats').then(r => r.data); },
    review(id: string, action: string) { return apiClient.post(`/admin/communication/reports/${id}/review`, { action }).then(r => r.data); },
    dismiss(id: string) { return apiClient.post(`/admin/communication/reports/${id}/dismiss`).then(r => r.data); },
  },
};
