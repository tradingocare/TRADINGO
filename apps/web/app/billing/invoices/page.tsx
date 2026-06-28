'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api/client'
import { Search, Filter, Loader2, Download, Eye, FileText, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  GENERATED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  VOID: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

interface Invoice {
  id: string; invoiceNumber: string; planName: string; status: string
  totalAmount: string; taxAmount: string; issuedAt: string
  items: any[]; taxBreakdown: any[]
  payment: { gateway: string; gatewayPaymentId: string }
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await api.get(`/billing/invoices?${params}`)
      const d = res.data?.data || res.data || res
      setInvoices(d.data || d)
      if (d.meta) setTotalPages(d.meta.totalPages || 1)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [page, statusFilter])

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      window.open(url, '_blank')
    } catch {}
  }

  const formatAmount = (n: string | number) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500">View and download your GST invoices</p>
          </div>
          <button onClick={() => router.push('/billing/history')}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            View History
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex-1 min-w-[200px]">
                <Search size={14} className="text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchInvoices()}
                  placeholder="Search by invoice # or plan..."
                  className="bg-transparent text-sm outline-none flex-1 text-gray-900" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 outline-none">
                <option value="">All Status</option>
                <option value="GENERATED">Generated</option>
                <option value="PAID">Paid</option>
                <option value="SENT">Sent</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <div key={inv.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={14} className="text-gray-400" />
                        <span className="font-bold text-sm text-gray-900">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {inv.planName || 'Subscription'} — {formatDate(inv.issuedAt)}
                      </p>
                      {inv.payment?.gateway && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{inv.payment.gateway} • {inv.payment.gatewayPaymentId?.slice(0, 12)}...</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-bold text-sm text-gray-900">{formatAmount(inv.totalAmount)}</span>
                      <button onClick={() => router.push(`/billing/invoices/${inv.id}`)}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(inv.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">No invoices found</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
