'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, Search, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

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
    } catch {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try { await api.post(`/admin/products/approval/${id}/approve`); toast({ title: 'Approved', description: 'Product approved successfully' }); fetchProducts() } catch {
      toast({ title: 'Error', description: 'Failed to approve product', variant: 'destructive' })
    } finally { setActionLoading(null) }
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return
    setActionLoading(rejectModal.id)
    try {
      await api.post(`/admin/products/approval/${rejectModal.id}/reject`, { reason: rejectReason })
      toast({ title: 'Rejected', description: 'Product rejected' })
      setRejectModal(null); setRejectReason(''); fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Failed to reject product', variant: 'destructive' })
    } finally { setActionLoading(null) }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)' }} />
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Product Approval</h1>
            <p className="text-sm text-white/50">Review and approve products submitted by sellers</p>
          </div>
          <button onClick={() => router.push('/admin/products/approval/audit')}
            className="px-3 py-2 rounded-xl border border-border text-sm font-semibold text-white/60 hover:bg-surface-secondary flex items-center gap-1.5">
            <Clock size={14} /> Audit Trail
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
        ) : (
          <div className="bg-surface rounded-3xl border border-border overflow-hidden" style={{ backdropFilter: 'blur(24px)' }}>
            <div className="divide-y divide-white/[0.06]">
              {products.map(p => (
                <div key={p.id} className="p-4 hover:bg-surface transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-surface-secondary">
                      {p.media?.[0]?.url ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" /> : <Eye size={20} className="text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-xs text-white/50">{p.company?.name}{p.category?.name && ` — ${p.category.name}`}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        Submitted {new Date(p.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {p.approvals?.[0]?.action === 'SUBMITTED' && ` — pending review`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => router.push(`/seller/products/${p.id}/edit`)}
                        className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-white/60 hover:bg-surface-secondary flex items-center gap-1">
                        <Eye size={12} /> View
                      </button>
                      <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}
                        className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20 border border-green-500/20 flex items-center gap-1 disabled:opacity-50">
                        {actionLoading === p.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                      </button>
                      <button onClick={() => setRejectModal({ id: p.id, name: p.name })}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                {products.length === 0 && (
                <EmptyState variant="empty" title="No products pending approval" className="!bg-transparent !border-0" />
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-white/40">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-white/60 hover:bg-surface-secondary disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-white/60 hover:bg-surface-secondary disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        )}

        <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Product">
          <p className="text-sm text-white/50 mb-4">{rejectModal?.name}</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)..."
            className="w-full rounded-xl border border-border px-4 py-3 text-sm text-white outline-none focus:border-orange-400 min-h-[100px] resize-none bg-surface" />
          <div className="flex items-center justify-end gap-3 mt-4">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:bg-surface-secondary">Cancel</button>
            <button onClick={handleReject} disabled={!rejectReason}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">Reject</button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
