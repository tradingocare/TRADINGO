'use client';

import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from 'react';
import { useSocket } from './socket-provider';
import type { ChatMessage, Conversation } from '@/lib/api/types';

interface ChatContextType {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  unreadCounts: Record<string, number>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  messages: {},
  sendMessage: () => {},
  markAsRead: () => {},
  unreadCounts: {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!socket) return;

    socket.emit('chat:subscribe');

    socket.on('chat:conversations', (data: Conversation[]) => {
      setConversations(data);
      const counts: Record<string, number> = {};
      data.forEach((c) => { counts[c.id] = c.unreadCount || 0; });
      setUnreadCounts(counts);
    });

    socket.on('chat:message', (message: ChatMessage) => {
      setMessages((prev) => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] || []), message],
      }));
      setUnreadCounts((prev) => ({
        ...prev,
        [message.conversationId]: (prev[message.conversationId] || 0) + 1,
      }));
    });

    socket.on('chat:conversation_updated', (conv: Conversation) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = conv;
          return updated;
        }
        return [conv, ...prev];
      });
    });

    return () => {
      socket.emit('chat:unsubscribe');
      socket.off('chat:conversations');
      socket.off('chat:message');
      socket.off('chat:conversation_updated');
    };
  }, [socket]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!socket) return;
    socket.emit('chat:send', { conversationId, content });
  }, [socket]);

  const markAsRead = useCallback((conversationId: string) => {
    if (!socket) return;
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
    socket.emit('chat:read', { conversationId });
  }, [socket]);

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, markAsRead, unreadCounts }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
