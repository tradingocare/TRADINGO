import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '@/lib/api/communication';

export function useCommConversations(params?: { source?: string; archived?: boolean }) {
  return useQuery({ queryKey: ['communication', 'conversations', params], queryFn: () => communicationApi.conversations.list(params) });
}

export function useConversation(id: string) {
  return useQuery({ queryKey: ['communication', 'conversations', id], queryFn: () => communicationApi.conversations.get(id), enabled: !!id });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => communicationApi.conversations.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function useArchiveConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.conversations.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function useMuteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; muted: boolean }) => communicationApi.conversations.mute(data.id, data.muted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function usePinConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; pinned: boolean }) => communicationApi.conversations.pin(data.id, data.pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'conversations'] }),
  });
}

export function useConversationMessages(conversationId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['communication', 'messages', conversationId, params],
    queryFn: () => communicationApi.messages.list(conversationId, params),
    enabled: !!conversationId,
  });
}

export function useCommSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { conversationId: string; content: string; type?: string; attachments?: any[] }) =>
      communicationApi.messages.send(data.conversationId, { content: data.content, type: data.type, attachments: data.attachments }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => communicationApi.messages.markRead(conversationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication'] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { conversationId: string; messageId: string }) => communicationApi.messages.delete(data.conversationId, data.messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'messages'] }),
  });
}

export function useReportMessage() {
  return useMutation({
    mutationFn: (data: { conversationId: string; messageId: string; reason: string; description?: string }) =>
      communicationApi.messages.report(data.conversationId, data.messageId, { reason: data.reason, description: data.description }),
  });
}

export function useUnreadMessageCount() {
  return useQuery({ queryKey: ['communication', 'unread-count'], queryFn: () => communicationApi.messages.unreadCount() });
}

export function useLabels() {
  return useQuery({ queryKey: ['communication', 'labels'], queryFn: () => communicationApi.labels.list() });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => communicationApi.labels.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'labels'] }),
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.labels.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'labels'] }),
  });
}

export function useTemplates(category?: string) {
  return useQuery({ queryKey: ['communication', 'templates', category], queryFn: () => communicationApi.templates.list(category) });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; category?: string; isShared?: boolean }) => communicationApi.templates.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.templates.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communication', 'templates'] }),
  });
}

export function useModerationReports(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({ queryKey: ['admin', 'communication', 'reports', params], queryFn: () => communicationApi.moderation.reports(params) });
}

export function useModerationStats() {
  return useQuery({ queryKey: ['admin', 'communication', 'stats'], queryFn: () => communicationApi.moderation.stats() });
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; action: string }) => communicationApi.moderation.review(data.id, data.action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'communication'] }),
  });
}

export function useDismissReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.moderation.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'communication'] }),
  });
}
