'use client';

import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react';
import { useSocket } from './socket-provider';

interface TypingContextType {
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  typingUsers: Record<string, string[]>;
}

const TypingContext = createContext<TypingContextType>({
  startTyping: () => {},
  stopTyping: () => {},
  typingUsers: {},
});

export function TypingProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const typingUsersRef = useRef<Record<string, string[]>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const startTyping = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('typing:start', { conversationId });

    if (timersRef.current[conversationId]) {
      clearTimeout(timersRef.current[conversationId]);
    }
    timersRef.current[conversationId] = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 3000);
  }, [socket]);

  const stopTyping = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('typing:stop', { conversationId });
    if (timersRef.current[conversationId]) {
      clearTimeout(timersRef.current[conversationId]);
    }
  }, [socket]);

  if (socket) {
    socket.off('typing:update').on('typing:update', (data: { conversationId: string; userId: string; userName: string; typing: boolean }) => {
      const current = { ...typingUsersRef.current };
      const list = current[data.conversationId] || [];
      if (data.typing) {
        if (!list.includes(data.userName)) {
          current[data.conversationId] = [...list, data.userName];
        }
      } else {
        current[data.conversationId] = list.filter((n) => n !== data.userName);
      }
      typingUsersRef.current = current;
    });
  }

  return (
    <TypingContext.Provider value={{ startTyping, stopTyping, typingUsers: typingUsersRef.current }}>
      {children}
    </TypingContext.Provider>
  );
}

export function useTyping() {
  return useContext(TypingContext);
}
