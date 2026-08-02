import api from './client'

export interface SmsStats {
  totalSent: number
  totalFailed: number
  successRate: number
  byProvider: Record<string, number>
  byTemplate: Record<string, number>
  todayCount: number
}

export interface SmsLogEntry {
  id: string
  phoneNumber: string
  message: string
  template: string | null
  provider: string
  status: string
  messageId: string | null
  error: string | null
  cost: string | null
  createdAt: string
}

export interface SmsLogsResponse {
  data: SmsLogEntry[]
  total: number
  page: number
  limit: number
}

export async function getSmsStats(): Promise<SmsStats> {
  const res = await api.get('/sms/stats')
  return res.data
}

export async function getSmsLogs(params?: {
  phoneNumber?: string
  status?: string
  template?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<SmsLogsResponse> {
  const query = new URLSearchParams()
  if (params?.phoneNumber) query.set('phoneNumber', params.phoneNumber)
  if (params?.status) query.set('status', params.status)
  if (params?.template) query.set('template', params.template)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const res = await api.get(`/sms/logs?${query}`)
  return res.data
}

export async function sendTestSms(phoneNumber: string, template?: string): Promise<void> {
  await api.post('/sms/send-test', { phoneNumber, template })
}
