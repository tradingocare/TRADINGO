import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type GetNotificationsParams,
} from '@/lib/api/notifications';


export function useNotifications(params?: GetNotificationsParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await getNotifications({ read: false, limit: 1 });
      return res.total;
    },
    staleTime: 30_000,
  });
}
