'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Package, Search, Filter, Eye, Edit2, Trash2, Plus } from 'lucide-react'

const products = [
  { id: 'PRD-001', name: 'MS Flat Bars', seller: 'Kumar Steel Industries', category: 'Steel', price: '₹42,000/ton', stock: 150, status: 'active', date: '2026-06-20' },
  { id: 'PRD-002', name: 'TMT Bars 12mm', seller: 'Sharma Steel Corp', category: 'Steel', price: '₹48,500/ton', stock: 200, status: 'active', date: '2026-06-19' },
  { id: 'PRD-003', name: 'Copper Wire 2.5sqmm', seller: 'Patel Electricals', category: 'Electrical', price: '₹890/kg', stock: 500, status: 'pending', date: '2026-06-18' },
  { id: 'PRD-004', name: 'Portland Cement 53 Grade', seller: 'Bharat Cement Co.', category: 'Cement', price: '₹380/bag', stock: 5000, status: 'active', date: '2026-06-17' },
  { id: 'PRD-005', name: 'PVC Pipes 4 inch', seller: 'AquaFlow Industries', category: 'Plumbing', price: '₹1,200/piece', stock: 0, status: 'inactive', date: '2026-06-15' },
]

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  inactive: 'bg-red-500/10 text-red-400',
}

export default function AdminProductsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Products"
          description="Manage all product listings across the platform."
        />

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 backdrop-blur-md focus:border-[#FF4D00]/30 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90">
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="hidden grid-cols-12 gap-4 border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase text-white/40 sm:grid">
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Seller</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Stock</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2" />
          </div>
          {products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center"
            >
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF4D00]/10 text-[#FF4D00]">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-white/40 sm:hidden">{product.id}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 sm:col-span-2">{product.seller}</p>
              <p className="text-sm text-white/60 sm:col-span-2">{product.category}</p>
              <p className="text-sm font-medium text-white sm:col-span-1">{product.price}</p>
              <p className="text-sm text-white/60 sm:col-span-1">{product.stock}</p>
              <div className="sm:col-span-1">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[product.status]}`}>
                  {product.status}
                </span>
              </div>
              <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                <button className="rounded-lg border border-white/[0.09] bg-white/[0.04] p-1.5 text-white/40 transition-colors hover:text-[#FF4D00]">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-lg border border-white/[0.09] bg-white/[0.04] p-1.5 text-white/40 transition-colors hover:text-[#FF4D00]">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-lg border border-white/[0.09] bg-white/[0.04] p-1.5 text-white/40 transition-colors hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
