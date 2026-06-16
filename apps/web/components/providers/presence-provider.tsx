'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSocket } from './socket-provider';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  isUserOnline: () => false,
});

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    socket.emit('presence:online');

    socket.on('presence:online_users', (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('presence:user_online', (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('presence:user_offline', (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.emit('presence:offline');
      socket.off('presence:online_users');
      socket.off('presence:user_online');
      socket.off('presence:user_offline');
    };
  }, [socket]);

  useEffect(() => {
    if (!isConnected && socket) {
      socket.emit('presence:online');
    }
  }, [isConnected, socket]);

  const isUserOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, isUserOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
