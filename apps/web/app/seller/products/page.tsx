'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Plus, Search, Grid3X3, List, Edit3, Copy, Trash2, Archive, Send, Eye, MoreHorizontal, Loader2, Package, AlertTriangle } from 'lucide-react'

const TABS = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] as const
const TAB_LABELS: Record<string, string> = { ALL: 'All', DRAFT: 'Drafts', PENDING_APPROVAL: 'Pending', REJECTED: 'Rejected', ACTIVE: 'Live', INACTIVE: 'Inactive', DISCONTINUED: 'Archived' }
const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800', ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-blue-100 text-blue-600', DISCONTINUED: 'bg-gray-100 text-gray-400',
}

export default function SellerProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

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
    } catch {}
    finally { setLoading(false) }
  }, [activeTab, page, search])

  const fetchCounts = async () => {
    try {
      const res = await api.get('/seller/products/status-counts')
      setCounts(res.data || {})
    } catch {}
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
    } catch {}
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
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <button onClick={() => router.push('/seller/products/new')}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 flex items-center gap-2 transition-all">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(1) }}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                  activeTab === tab ? 'text-orange-500 bg-orange-50 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                {TAB_LABELS[tab]}
                {(counts[tab] || counts[tab] === 0) && tab !== 'ALL' && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{counts[tab]}</span>
                )}
                {tab === 'ALL' && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">{counts.TOTAL || 0}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 p-4 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex-1">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts()}
                placeholder="Search products..."
                className="bg-transparent text-sm outline-none flex-1 text-gray-900" />
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><List size={16} /></button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><Grid3X3 size={16} /></button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No {activeTab === 'ALL' ? '' : TAB_LABELS[activeTab].toLowerCase() + ' '}products</p>
            <button onClick={() => router.push('/seller/products/new')} className="mt-3 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold inline-flex items-center gap-2">
              <Plus size={16} /> Add Product
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-gray-100">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.media?.[0]?.url ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>{TAB_LABELS[p.status] || p.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {p.category?.name && `${p.category.name} — `}{p.sku && `SKU: ${p.sku}`}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(p)}</p>
                  <p className="text-xs text-gray-400">{p.inventory?.availableQuantity || 0} {p.unit || 'pcs'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {p.status === 'DRAFT' && <button onClick={() => handleAction('submit', p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50" title="Submit"><Send size={15} /></button>}
                  <button onClick={() => router.push(`/seller/products/${p.id}/edit`)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50" title="Edit"><Edit3 size={15} /></button>
                  <button onClick={() => handleAction('duplicate', p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-purple-50" title="Duplicate"><Copy size={15} /></button>
                  {p.status !== 'DISCONTINUED' && <button onClick={() => handleAction('archive', p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50" title="Archive"><Archive size={15} /></button>}
                  <button onClick={() => handleAction('delete', p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {products.map(p => (
              <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group">
                <div className="h-32 bg-gray-100 flex items-center justify-center">
                  {p.media?.[0]?.url ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" /> : <Package size={28} className="text-gray-300" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatPrice(p)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>{TAB_LABELS[p.status] || p.status}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => router.push(`/seller/products/${p.id}/edit`)} className="p-1 rounded text-gray-400 hover:text-blue-500"><Edit3 size={13} /></button>
                      <button onClick={() => handleAction('duplicate', p.id)} className="p-1 rounded text-gray-400 hover:text-purple-500"><Copy size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
