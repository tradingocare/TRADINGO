'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, Search, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminApprovalPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/products/approval?page=${page}&limit=15`)
      const d = res.data?.data || res
      setProducts(d.data || [])
      if (d.meta) setTotalPages(d.meta.totalPages || 1)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try { await api.post(`/admin/products/approval/${id}/approve`); fetchProducts() } catch {}
    finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return
    setActionLoading(rejectModal.id)
    try {
      await api.post(`/admin/products/approval/${rejectModal.id}/reject`, { reason: rejectReason })
      setRejectModal(null); setRejectReason(''); fetchProducts()
    } catch {}
    finally { setActionLoading(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Product Approval</h1>
            <p className="text-sm text-gray-500">Review and approve products submitted by sellers</p>
          </div>
          <button onClick={() => router.push('/admin/products/approval/audit')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <Clock size={14} /> Audit Trail
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {products.map(p => (
                <div key={p.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.media?.[0]?.url ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" /> : <Eye size={20} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.company?.name}{p.category?.name && ` — ${p.category.name}`}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Submitted {new Date(p.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {p.approvals?.[0]?.action === 'SUBMITTED' && ` — pending review`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => router.push(`/seller/products/${p.id}/edit`)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                        <Eye size={12} /> View
                      </button>
                      <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                        className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 border border-green-200 flex items-center gap-1 disabled:opacity-50">
                        {actionLoading === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                      </button>
                      <button onClick={() => setRejectModal({ id: p.id, name: p.name })}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200 flex items-center gap-1">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">No products pending approval</div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        )}

        {rejectModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRejectModal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Product</h3>
              <p className="text-sm text-gray-500 mb-4">{rejectModal.name}</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (required)..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 min-h-[100px] resize-none" />
              <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} disabled={!rejectReason}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
