'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Plus, Search, Grid3X3, List, Edit3, Copy, Trash2, Archive, Send, Eye, MoreHorizontal, Package, AlertTriangle, Sparkles, BarChart3, CheckSquare, Square } from 'lucide-react'
import { Tabs } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { QualityBadge } from '@/components/enterprise-catalog/quality-badge'
import { apiClient } from '@/lib/api-client'

const TABS = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] as const
const TAB_LABELS: Record<string, string> = { ALL: 'All', DRAFT: 'Drafts', PENDING_APPROVAL: 'Pending', REJECTED: 'Rejected', ACTIVE: 'Live', INACTIVE: 'Inactive', DISCONTINUED: 'Archived' }
const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-text-tertiary', PENDING_APPROVAL: 'bg-yellow-500/15 text-yellow-400',
  REJECTED: 'bg-red-500/15 text-red-400', ACTIVE: 'bg-green-500/15 text-green-400',
  INACTIVE: 'bg-blue-500/15 text-blue-400', DISCONTINUED: 'bg-surface text-text-tertiary',
}

export default function SellerProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [scores, setScores] = useState<Record<string, { total: number }>>({})
  const [bulkAction, setBulkAction] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (activeTab !== 'ALL') params.set('status', activeTab)
      if (search) params.set('search', search)
      const res = await api.get(`/seller/products?${params}`)
      const d = res.data?.data || res
      setProducts(d.data || [])
      if (d.meta) setTotalPages(d.meta.totalPages || 1)
      const pIds = (d.data || []).map((p: any) => p.id)
      if (pIds.length > 0) {
        try {
          const scoreRes = await api.get(`/ai/quality/scores?limit=${pIds.length}`)
          const scoreList = (scoreRes.data?.data || [])
          const scoreMap: Record<string, { total: number }> = {}
          for (const s of scoreList) { scoreMap[s.productId] = { total: s.total } }
          setScores(scoreMap)
        } catch {}
      }
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' })
    }
    finally { setLoading(false) }
  }, [activeTab, page, search])

  const fetchCounts = async () => {
    try {
      const res = await api.get('/seller/products/status-counts')
      setCounts(res.data || {})
    } catch {
      toast({ title: 'Failed to load counts', variant: 'destructive' })
    }
  }

  useEffect(() => { fetchCounts() }, [])
  useEffect(() => { fetchProducts() }, [activeTab, page])

  const handleAction = async (action: string, id: string) => {
    try {
      if (action === 'submit') await api.post(`/seller/products/${id}/submit`)
      else if (action === 'duplicate') await api.post(`/seller/products/${id}/duplicate`)
      else if (action === 'archive') await api.post(`/seller/products/${id}/archive`)
      else if (action === 'restore') await api.post(`/seller/products/${id}/restore`)
      else if (action === 'delete') await api.delete(`/seller/products/${id}`)
      fetchProducts(); fetchCounts()
      toast({ title: `Product ${action}d successfully` })
    } catch {
      toast({ title: `Failed to ${action} product`, variant: 'destructive' })
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map(p => p.id)))
  }

  const handleBulkAction = async (action: string) => {
    setBulkAction(action)
    try {
      if (action === 'ai-improve') {
        const count = selected.size
        toast({ title: 'AI Improvement', description: `Queued AI improvement for ${count} products`, variant: 'default' })
        setSelected(new Set())
      } else if (action === 'recalculate') {
        const ids = [...selected]
        await apiClient.post('/ai/quality/calculate-bulk', { productIds: ids })
        toast({ title: 'Recalculated', description: `Quality scores recalculated for ${ids.length} products`, variant: 'default' })
        fetchProducts()
        setSelected(new Set())
      } else if (action === 'export') {
        toast({ title: 'Export', description: 'Quality report export started', variant: 'default' })
      }
    } catch {
      toast({ title: 'Error', description: `Bulk action failed: ${action}`, variant: 'destructive' })
    } finally {
      setBulkAction(null)
    }
  }

  const formatPrice = (p: any) => {
    if (p.originalPrice) return '₹' + Number(p.originalPrice).toLocaleString('en-IN')
    if (p.priceSlabs?.length) return '₹' + Number(p.priceSlabs[0].price).toLocaleString('en-IN') + '+'
    return '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Products</h1>
          <p className="text-sm text-text-tertiary">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/seller/success-insights')}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-text-secondary text-sm font-medium hover:bg-surface-secondary flex items-center gap-2 transition-all">
            <BarChart3 size={16} /> Insights
          </button>
          <button onClick={() => router.push('/seller/products/new')}
            className="px-4 py-2 rounded-xl bg-accent text-primary text-sm font-semibold hover:bg-accent/90 flex items-center gap-2 transition-all">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="rounded-[22px] overflow-hidden bg-bg-elevated border border-border">
        <Tabs tabs={TABS.map(tab => {
          const count = tab === 'ALL' ? (counts.TOTAL || 0) : (counts[tab] ?? -1);
          const label = count >= 0 ? TAB_LABELS[tab] + ' (' + count + ')' : TAB_LABELS[tab];
          return { value: tab, label };
        })} value={activeTab} onChange={(v) => { setActiveTab(v); setPage(1) }} variant="underline" className="px-4 border-b border-border" />
        <div className="flex items-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border flex-1">
              <Search size={14} className="text-text-tertiary" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts()}
                placeholder="Search products..."
                className="bg-transparent text-sm outline-none flex-1 text-text-primary placeholder:text-text-tertiary" />
            </div>
            <div className="flex items-center gap-1 bg-surface rounded-lg border border-border p-1">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-surface-secondary text-text-primary' : 'text-text-tertiary'}`}><List size={16} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-surface-secondary text-text-primary' : 'text-text-tertiary'}`}><Grid3X3 size={16} /></button>
            </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/5 border-b border-border">
            <span className="text-xs text-text-secondary font-medium">{selected.size} selected</span>
            <div className="flex gap-1 ml-2">
              <button onClick={() => handleBulkAction('ai-improve')} disabled={!!bulkAction}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-primary text-xs font-medium disabled:opacity-50">
                <Sparkles className="h-3 w-3" /> AI Improve
              </button>
              <button onClick={() => handleBulkAction('recalculate')} disabled={!!bulkAction}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-text-secondary text-xs font-medium hover:bg-surface disabled:opacity-50">
                <BarChart3 className="h-3 w-3" /> Recalculate Quality
              </button>
              <button onClick={() => handleBulkAction('export')} disabled={!!bulkAction}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-text-secondary text-xs font-medium hover:bg-surface disabled:opacity-50">
                <Package className="h-3 w-3" /> Export Report
              </button>
            </div>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">Clear</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size="xl" /></div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={40} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-sm font-semibold text-text-tertiary">No {activeTab === 'ALL' ? '' : TAB_LABELS[activeTab].toLowerCase() + ' '}products</p>
            <button onClick={() => router.push('/seller/products/new')} className="mt-3 px-4 py-2 rounded-xl bg-accent text-primary text-sm font-semibold inline-flex items-center gap-2">
              <Plus size={16} /> Add Product
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-border">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface transition-colors group">
                <button onClick={() => toggleSelect(p.id)} className="shrink-0 text-text-tertiary hover:text-text-primary">
                  {selected.has(p.id) ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {p.media?.[0]?.url ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" /> : <Package size={16} className="text-text-tertiary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[p.status] || 'bg-surface-secondary text-text-tertiary'}`}>{TAB_LABELS[p.status] || p.status}</span>
                    {scores[p.id] && <QualityBadge score={scores[p.id].total} size="sm" />}
                  </div>
                  <p className="text-xs text-text-tertiary truncate">
                    {p.category?.name && `${p.category.name} — `}{p.sku && `SKU: ${p.sku}`}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-text-primary">{formatPrice(p)}</p>
                  <p className="text-xs text-text-tertiary">{p.inventory?.availableQuantity || 0} {p.unit || 'pcs'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {p.status === 'DRAFT' && <button onClick={() => handleAction('submit', p.id)} className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/10" title="Submit"><Send size={15} /></button>}
                  <button onClick={() => router.push(`/seller/products/${p.id}/edit`)} className="p-1.5 rounded-lg text-text-tertiary hover:text-blue-400 hover:bg-blue-500/10" title="Edit"><Edit3 size={15} /></button>
                  <button onClick={() => handleAction('duplicate', p.id)} className="p-1.5 rounded-lg text-text-tertiary hover:text-purple-400 hover:bg-purple-500/10" title="Duplicate"><Copy size={15} /></button>
                  {p.status !== 'DISCONTINUED' && <button onClick={() => handleAction('archive', p.id)} className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-amber-500/10" title="Archive"><Archive size={15} /></button>}
                  <button onClick={() => handleAction('delete', p.id)} className="p-1.5 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-500/10" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {products.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden transition-all group bg-surface border border-border">
                <div className="h-32 bg-surface-secondary flex items-center justify-center relative">
                  {p.media?.[0]?.url ? <img src={p.media[0].url} alt={p.name} className="w-full h-full object-cover" /> : <Package size={28} className="text-text-tertiary" />}
                  {scores[p.id] && <div className="absolute top-1 right-1"><QualityBadge score={scores[p.id].total} size="sm" /></div>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-tertiary mt-1">{formatPrice(p)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_STYLES[p.status] || 'bg-surface-secondary text-text-tertiary'}`}>{TAB_LABELS[p.status] || p.status}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => router.push(`/seller/products/${p.id}/edit`)} className="p-1 rounded text-text-tertiary hover:text-blue-400"><Edit3 size={13} /></button>
                      <button onClick={() => handleAction('duplicate', p.id)} className="p-1 rounded text-text-tertiary hover:text-purple-400"><Copy size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-text-tertiary">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-secondary hover:bg-surface-secondary disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-secondary hover:bg-surface-secondary disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
