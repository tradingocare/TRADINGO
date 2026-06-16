'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSocket } from './socket-provider';
import type { Notification } from '@/lib/api/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  showToast: boolean;
  toastNotification: Notification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  showToast: false,
  toastNotification: null,
  dismissToast: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit('notification:subscribe');

    socket.on('notification:list', (data: Notification[]) => {
      setNotifications(data);
    });

    socket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setToastNotification(notification);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    });

    socket.on('notification:updated', (updated: Notification) => {
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    });

    return () => {
      socket.emit('notification:unsubscribe');
      socket.off('notification:list');
      socket.off('notification:new');
      socket.off('notification:updated');
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
    setToastNotification(n);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  }, []);

  const markRead = useCallback((id: string) => {
    if (!socket) return;
    socket.emit('notification:read', { id });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [socket]);

  const markAllRead = useCallback(() => {
    if (!socket) return;
    socket.emit('notification:read_all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [socket]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
    setToastNotification(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, showToast, toastNotification, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
