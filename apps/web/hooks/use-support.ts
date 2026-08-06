import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as supportApi from '@/lib/api/support'

const SUPPORT_KEY = 'support'

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUPPORT_KEY, 'tickets'] }),
  })
}

export function useTickets(params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [SUPPORT_KEY, 'tickets', params],
    queryFn: () => supportApi.getTickets(params),
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: [SUPPORT_KEY, 'ticket', id],
    queryFn: () => supportApi.getTicket(id),
    enabled: !!id,
  })
}

export function useAddMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, ...dto }: { ticketId: string; message: string; attachments?: any[] }) =>
      supportApi.addMessage(ticketId, dto),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [SUPPORT_KEY, 'ticket', variables.ticketId] }),
  })
}

export function useUpdateTicketStatus() {
  return useMutation({
    mutationFn: ({ ticketId, ...dto }: { ticketId: string; status: string; note?: string }) =>
      supportApi.updateTicketStatus(ticketId, dto),
  })
}

export function useAssignTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) =>
      supportApi.assignTicket(ticketId, assigneeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SUPPORT_KEY, 'tickets'] }),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: [SUPPORT_KEY, 'categories'],
    queryFn: supportApi.getCategories,
  })
}

export function useSupportStats() {
  return useQuery({
    queryKey: [SUPPORT_KEY, 'stats'],
    queryFn: supportApi.getStats,
  })
}
