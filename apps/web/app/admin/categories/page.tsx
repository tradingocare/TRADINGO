'use client'

import { PageHeader } from '@/components/shared/page-header'
import { FolderTree, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react'
import { CATALOG_CATEGORIES } from '@/data/catalog-data'

const categories = CATALOG_CATEGORIES.map(c => ({
  name: c.name,
  slug: c.slug,
  products: c.productCount + c.serviceCount,
  subcategories: c.subcategories.map(s => s.name),
}))

export default function AdminCategoriesPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Categories"
          description="Manage product categories and subcategories."
        />

        <div className="mt-8 flex justify-end">
          <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {categories.map((category) => (
            <div
              key={category.slug}
              className="rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00]">
                    <FolderTree className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{category.name}</h3>
                    <p className="text-xs text-white/50">{category.products.toLocaleString()} products &middot; {category.subcategories.length} subcategories</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-white/[0.09] bg-white/[0.04] p-2 text-white/40 transition-colors hover:text-[#FF4D00]">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg border border-white/[0.09] bg-white/[0.04] p-2 text-white/40 transition-colors hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.subcategories.map((sub) => (
                  <span
                    key={sub}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60"
                  >
                    {sub}
                    <ChevronRight className="h-3 w-3 text-white/30" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
