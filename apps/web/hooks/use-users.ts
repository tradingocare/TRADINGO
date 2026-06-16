import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, getUser, updateUser, type GetUsersParams } from '@/lib/api/users';
import type { User } from '@/lib/api/types';

export function useUsers(params?: GetUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
