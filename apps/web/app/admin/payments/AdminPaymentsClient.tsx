'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Search, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Select } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Table, THead, TR, TH, TBody, TD } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400',
  PROCESSING: 'bg-blue-500/15 text-blue-400',
  CAPTURED: 'bg-green-500/15 text-green-400',
  FAILED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-purple-500/15 text-purple-400',
}

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  PROCESSING: Loader2,
  CAPTURED: CheckCircle2,
  FAILED: XCircle,
  REFUNDED: RefreshCcw,
}

interface Payment {
  id: string; type: string; gateway: string; status: string
  amount: number; currency: string; description: string
  gatewayOrderId: string; gatewayPaymentId: string
  paidAt: string | null; createdAt: string
  company: { id: string; name: string; email: string }
  refunds: { id: string; amount: number; status: string; createdAt: string }[]
}

interface Stats {
  total: number; captured: number; failed: number; pending: number; refunded: number; totalRevenue: number
}

export default function AdminPaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')
  const [view, setView] = useState<'transactions' | 'gateway-logs'>('transactions')

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (gatewayFilter) params.set('gateway', gatewayFilter)
      if (search) params.set('search', search)

      const [payRes, statsRes] = await Promise.all([
        api.get(`/admin/payments?${params}`),
        api.get('/admin/payments/stats'),
      ])

      const payData = payRes.data?.data || payRes.data || payRes
      setPayments(payData.data || payData)
      if (payData.meta) setTotalPages(payData.meta.totalPages || 1)

      const statsData = statsRes.data?.data || statsRes.data || statsRes
      setStats(statsData)
    } catch {
      toast({ title: 'Error', description: 'Failed to load payments', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPayments() }, [page, statusFilter, gatewayFilter])

  const handleSearch = () => { setPage(1); fetchPayments() }

  const formatAmount = (n: number) => '₹' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-white mb-6">Payment Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-surface' },
              { label: 'Captured', value: stats.captured, color: 'text-green-400', bg: 'bg-green-500/15' },
              { label: 'Failed', value: stats.failed, color: 'text-red-400', bg: 'bg-red-500/15' },
              { label: 'Pending', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/15' },
              { label: 'Refunded', value: stats.refunded, color: 'text-purple-400', bg: 'bg-purple-500/15' },
              { label: 'Revenue', value: formatAmount(stats.totalRevenue), color: 'text-orange-400', bg: 'bg-orange-500/15' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-border p-4`}>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{s.label}</p>
                <p className={`text-lg font-black ${s.color} mt-1`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border flex-1 min-w-[200px]">
                <Search size={14} className="text-white/40" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by ID, company, gateway..."
                  className="bg-transparent text-sm outline-none flex-1 text-white placeholder-white/35" />
              </div>
              <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="CAPTURED">Captured</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </Select>
              <Select value={gatewayFilter} onChange={e => { setGatewayFilter(e.target.value); setPage(1) }}>
                <option value="">All Gateways</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="STRIPE">Stripe</option>
              </Select>
              <Select value={view} onChange={e => setView(e.target.value as any)}>
                <option value="transactions">Transactions</option>
                <option value="gateway-logs">Gateway Logs</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="default" />
            </div>
          ) : view === 'transactions' ? (
            payments.length === 0 ? (
              <div className="p-12"><EmptyState variant="empty" title="No payments found" /></div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>ID</TH>
                    <TH>Company</TH>
                    <TH>Gateway</TH>
                    <TH>Amount</TH>
                    <TH>Status</TH>
                    <TH>Date</TH>
                    <TH>Refunds</TH>
                  </TR>
                </THead>
                <TBody>
                  {payments.map(p => {
                    const StatusIcon = STATUS_ICONS[p.status] || AlertTriangle
                    return (
                      <TR key={p.id}>
                        <TD className="text-xs text-white/50 font-mono">{p.id.slice(0, 8)}...</TD>
                        <TD>
                          <div className="text-sm font-medium text-white">{p.company?.name || '—'}</div>
                          <div className="text-[10px] text-white/40">{p.company?.email || ''}</div>
                        </TD>
                        <TD className="text-xs text-white/60">{p.gateway}</TD>
                        <TD className="text-sm font-semibold text-white">{formatAmount(p.amount)}</TD>
                        <TD>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[p.status] || 'bg-surface-secondary text-white/60'}`}>
                            <StatusIcon size={10} /> {p.status}
                          </span>
                        </TD>
                        <TD className="text-xs text-white/50">{formatDate(p.createdAt)}</TD>
                        <TD className="text-xs text-white/50">{p.refunds?.length || 0}</TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            )
          ) : (
            <div className="p-6 text-center text-sm text-white/50">
              <p>Gateway webhook logs view — connect to backend endpoint</p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-white/40">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-white/60 hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-white/60 hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
