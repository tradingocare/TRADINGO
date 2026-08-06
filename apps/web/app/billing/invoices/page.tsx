'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Search, Loader2, Download, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const STATUS_STYLES: Record<string, string> = {
  GENERATED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  VOID: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-surface text-gray-500',
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
    } catch {
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchInvoices() }, [page, statusFilter])

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      window.open(url, '_blank')
    } catch {
      toast({ title: 'Error', description: 'Failed to download invoice', variant: 'destructive' })
    }
  }

  const formatAmount = (n: string | number) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-text-primary">Invoices</h1>
            <p className="text-sm text-text-secondary">View and download your GST invoices</p>
          </div>
          <button onClick={() => router.push('/billing/history')}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-text-secondary hover:bg-surface transition-all">
            View History
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border flex-1 min-w-[200px]">
                <Search size={14} className="text-text-tertiary" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchInvoices()}
                  placeholder="Search by invoice # or plan..."
                  className="bg-transparent text-sm outline-none flex-1 text-text-primary" />
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-lg border border-border text-sm bg-surface text-text-primary outline-none">
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
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map(inv => (
                <div key={inv.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={14} className="text-text-tertiary" />
                        <span className="font-bold text-sm text-text-primary">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[inv.status] || 'bg-surface text-text-secondary'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {inv.planName || 'Subscription'} — {formatDate(inv.issuedAt)}
                      </p>
                      {inv.payment?.gateway && (
                        <p className="text-[10px] text-text-tertiary mt-0.5">{inv.payment.gateway} • {inv.payment.gatewayPaymentId?.slice(0, 12)}...</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-bold text-sm text-text-primary">{formatAmount(inv.totalAmount)}</span>
                      <button onClick={() => router.push(`/billing/invoices/${inv.id}`)}
                        className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(inv.id)}
                        className="p-2 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10 transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="py-16 text-center text-sm text-text-tertiary">No invoices found</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-secondary hover:bg-surface disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-secondary hover:bg-surface disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
