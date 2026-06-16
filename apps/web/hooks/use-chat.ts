import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  getMessages,
  sendMessage,
  type GetMessagesParams,
} from '@/lib/api/chat';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });
}

export function useMessages(conversationId: string, params?: GetMessagesParams) {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => getMessages(conversationId, params),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      sendMessage(conversationId, content),
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
