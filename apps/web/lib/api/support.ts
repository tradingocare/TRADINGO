import apiClient from './client'

export interface SupportTicket {
  id: string
  companyId: string
  userId: string
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string | null
  assignedTo: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string }
  assignee?: { id: string; name: string; email: string } | null
  company?: { id: string; name: string; slug: string }
  _count?: { messages: number }
  messages?: SupportTicketMessage[]
}

export interface SupportTicketMessage {
  id: string
  ticketId: string
  userId: string
  message: string
  attachments: any
  createdAt: string
  user?: { id: string; name: string; email: string }
}

export interface TicketStats {
  open: number
  inProgress: number
  waiting: number
  resolved: number
  closed: number
  total: number
}

export async function createTicket(dto: { subject: string; description: string; category?: string; priority?: string }) {
  const { data } = await apiClient.post('/support/tickets', dto)
  return data
}

export async function getTickets(params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) {
  const { data } = await apiClient.get('/support/tickets', { params })
  return data
}

export async function getTicket(id: string) {
  const { data } = await apiClient.get(`/support/tickets/${id}`)
  return data
}

export async function addMessage(ticketId: string, dto: { message: string; attachments?: any[] }) {
  const { data } = await apiClient.post(`/support/tickets/${ticketId}/messages`, dto)
  return data
}

export async function updateTicketStatus(ticketId: string, dto: { status: string; note?: string }) {
  const { data } = await apiClient.patch(`/support/tickets/${ticketId}/status`, dto)
  return data
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  const { data } = await apiClient.post(`/support/tickets/${ticketId}/assign`, { assigneeId })
  return data
}

export async function getCategories() {
  const { data } = await apiClient.get('/support/categories')
  return data
}

export async function getStats() {
  const { data } = await apiClient.get('/support/stats')
  return data
}
