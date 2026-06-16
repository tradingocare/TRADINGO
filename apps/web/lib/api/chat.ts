import { apiClient } from './client';
import type { Conversation, ChatMessage } from './types';

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

export function getConversations() {
  return apiClient.get<Conversation[]>('/chat/conversations').then(r => r.data);
}

export function getMessages(conversationId: string, params?: GetMessagesParams) {
  return apiClient.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, { params }).then(r => r.data);
}

export function sendMessage(conversationId: string, content: string) {
  return apiClient.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, { content }).then(r => r.data);
}
