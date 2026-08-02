'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSmsStats, getSmsLogs, sendTestSms, type SmsStats, type SmsLogEntry } from '@/lib/api/admin-sms'
import { MessageSquare, Send, CheckCircle, XCircle, Activity, Phone, Search, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'

export default function AdminSmsConsolePage() {
  const [stats, setStats] = useState<SmsStats | null>(null)
  const [logs, setLogs] = useState<SmsLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [phoneFilter, setPhoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, logsData] = await Promise.all([
        getSmsStats(),
        getSmsLogs({ page, limit: 25, phoneNumber: phoneFilter || undefined, status: statusFilter || undefined }),
      ])
      setStats(statsData)
      setLogs(logsData.data)
      setTotal(logsData.total)
    } catch {
      toast({ title: 'Failed to load SMS data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, phoneFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSendTest = async () => {
    if (!testPhone) return
    setSending(true)
    try {
      await sendTestSms(testPhone)
      toast({ title: 'Test SMS sent' })
      setTestPhone('')
      fetchData()
    } catch {
      toast({ title: 'Failed to send test SMS', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">SMS Console</h1>
          <p className="text-sm text-text-tertiary">Monitor SMS delivery and send test messages</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Send size={16} />} label="Sent Today" value={stats?.todayCount} loading={loading} color="text-status-success" />
        <StatCard icon={<CheckCircle size={16} />} label="Total Sent" value={stats?.totalSent} loading={loading} color="text-status-info" />
        <StatCard icon={<XCircle size={16} />} label="Failed" value={stats?.totalFailed} loading={loading} color="text-status-error" />
        <StatCard icon={<Activity size={16} />} label="Success Rate" value={stats ? `${stats.successRate}%` : '-'} loading={loading} color="text-status-warning" />
        <StatCard icon={<Phone size={16} />} label="Provider" value={stats ? Object.keys(stats.byProvider).join(', ') || 'console' : '-'} loading={loading} color="text-accent" />
        <StatCard icon={<MessageSquare size={16} />} label="Templates Used" value={stats ? Object.keys(stats.byTemplate).length : '-'} loading={loading} color="text-accent" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <Send size={14} className="text-accent" />
          Send Test SMS
        </h2>
        <div className="flex gap-2">
          <input
            type="text" placeholder="+919876543210"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-tertiary bg-surface border border-border focus:outline-none"
          />
          <button
            onClick={handleSendTest}
            disabled={sending || !testPhone}
            className="px-4 py-2 rounded-lg text-xs font-bold text-text-primary bg-accent transition-all hover:opacity-80 disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : 'Send Test'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquare size={14} className="text-accent" />
            SMS Logs ({total})
          </h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface">
              <Search size={12} className="text-text-tertiary" />
              <input
                type="text" placeholder="Phone..."
                value={phoneFilter}
                onChange={(e) => { setPhoneFilter(e.target.value); setPage(1) }}
                className="w-28 bg-transparent text-xs text-text-primary placeholder-text-tertiary focus:outline-none"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="text-xs w-auto"
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState variant="empty" title="No SMS logs yet" className="!bg-transparent !border-0" />
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <THead>
                <TR><TH>Phone</TH><TH>Template</TH><TH>Status</TH><TH>Provider</TH><TH>Message</TH><TH>Date</TH></TR>
              </THead>
              <TBody>
                {logs.map((log) => (
                  <TR key={log.id}>
                    <TD className="text-text-primary font-mono">{log.phoneNumber}</TD>
                    <TD className="text-text-tertiary">{log.template || '-'}</TD>
                    <TD>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'sent' ? 'text-status-success bg-status-success/10' : 'text-status-error bg-status-error/10'
                      }`}>
                        {log.status === 'sent' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {log.status}
                      </span>
                    </TD>
                    <TD className="text-text-tertiary">{log.provider}</TD>
                    <TD className="text-text-tertiary max-w-[200px] truncate">{log.message}</TD>
                    <TD className="text-text-tertiary">{new Date(log.createdAt).toLocaleString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}

        {total > 25 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t-border">
            <span className="text-xs text-text-tertiary">
              Page {page} of {Math.ceil(total / 25)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg text-xs text-text-primary bg-surface hover:bg-surface/50 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 25)}
                className="px-3 py-1 rounded-lg text-xs text-text-primary bg-surface hover:bg-surface/50 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, loading, color,
}: {
  icon: React.ReactNode
  label: string
  value?: number | string
  loading: boolean
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[10px] text-text-tertiary uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-bold text-text-primary">
        {loading ? '-' : value ?? '0'}
      </div>
    </div>
  )
}
