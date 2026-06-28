'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api/client'
import { Search, Filter, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCcw, DollarSign, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  CAPTURED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
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
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPayments() }, [page, statusFilter, gatewayFilter])

  const handleSearch = () => { setPage(1); fetchPayments() }

  const formatAmount = (n: number) => '₹' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Payment Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Captured', value: stats.captured, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Failed', value: stats.failed, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Refunded', value: stats.refunded, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Revenue', value: formatAmount(stats.totalRevenue), color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4`}>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={`text-lg font-black ${s.color} mt-1`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex-1 min-w-[200px]">
                <Search size={14} className="text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by ID, company, gateway..."
                  className="bg-transparent text-sm outline-none flex-1 text-gray-900 placeholder:text-gray-400" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 outline-none">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="CAPTURED">Captured</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select value={gatewayFilter} onChange={e => { setGatewayFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 outline-none">
                <option value="">All Gateways</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="STRIPE">Stripe</option>
              </select>
              <select value={view} onChange={e => setView(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 outline-none">
                <option value="transactions">Transactions</option>
                <option value="gateway-logs">Gateway Logs</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-orange-500" />
            </div>
          ) : view === 'transactions' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Company</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Gateway</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase">Refunds</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const StatusIcon = STATUS_ICONS[p.status] || AlertTriangle
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{p.company?.name || '—'}</div>
                          <div className="text-[10px] text-gray-400">{p.company?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{p.gateway}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatAmount(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon size={10} /> {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.refunds?.length || 0}</td>
                      </tr>
                    )
                  })}
                  {payments.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No payments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              <p>Gateway webhook logs view — connect to backend endpoint</p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
