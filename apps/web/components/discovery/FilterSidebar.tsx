'use client'
import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import { SearchFilters } from '../../types/discovery'

interface Props {
  filters:    SearchFilters
  categories: { id: string; name: string; icon: string }[]
  onChange:   (partial: Partial<SearchFilters>) => void
  onReset:    () => void
  isOpen:     boolean
  onClose:    () => void
}

const SELLER_TYPES = [
  { value: 'manufacturer',      label: 'Manufacturer'      },
  { value: 'wholesaler',        label: 'Wholesaler'         },
  { value: 'distributor',       label: 'Distributor'        },
  { value: 'service_provider',  label: 'Service Provider'   },
]

const SORT_OPTIONS = [
  { value: 'relevance',   label: 'Most Relevant'  },
  { value: 'distance',    label: 'Nearest First'  },
  { value: 'rating',      label: 'Top Rated'      },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'newest',      label: 'Newest First'   },
]

function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b py-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">
          {title}
        </span>
        {open
          ? <ChevronUp size={13} className="text-white/30" />
          : <ChevronDown size={13} className="text-white/30" />
        }
      </button>
      {open && children}
    </div>
  )
}

export default function FilterSidebar({
  filters, categories, onChange, onReset, isOpen, onClose,
}: Props) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto
          w-72 lg:w-56 xl:w-64 overflow-y-auto no-scrollbar
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 pt-4 lg:pt-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'rgba(15, 5, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} style={{ color: '#FF4D00' }} />
            <span className="text-sm font-bold text-white">Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset}
              className="text-[10px] text-white/35 hover:text-white/70">
              Reset
            </button>
            <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4">
          <FilterSection title="Sort By">
            <select
              value={filters.sortBy || 'relevance'}
              onChange={e => onChange({ sortBy: e.target.value as any })}
              className="w-full rounded-xl px-3 py-2 text-xs text-white"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}
                  style={{ background: '#1D0001' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="Quick Filters">
            <div className="space-y-2">
              {[
                { key: 'verified' as const,     label: 'Verified Only'       },
                { key: 'topRated' as const,     label: 'Top Rated (4.5+)'    },
                { key: 'inStock' as const,      label: 'In Stock / Available' },
                { key: 'fastResponse' as const, label: 'Fast Response (<1hr)' },
              ].map(f => (
                <label key={f.key}
                  className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => onChange({ [f.key]: !filters[f.key] })}
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: filters[f.key]
                        ? '#FF4D00' : 'rgba(255,255,255,0.08)',
                      border: filters[f.key]
                        ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    }}>
                    {filters[f.key] && (
                      <span className="text-[8px] text-white font-black">&check;</span>
                    )}
                  </div>
                  <span className="text-xs text-white/60 group-hover:text-white/80">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Seller Type" defaultOpen={false}>
            <div className="space-y-1.5">
              {SELLER_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => onChange({
                    sellerType: filters.sellerType === t.value as any
                      ? undefined
                      : t.value as any,
                  })}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background: filters.sellerType === t.value
                      ? 'rgba(255,77,0,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    border: filters.sellerType === t.value
                      ? '1px solid rgba(255,77,0,0.35)'
                      : '1px solid transparent',
                    color: filters.sellerType === t.value
                      ? '#FF7A3D'
                      : 'rgba(255,255,255,0.55)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range" defaultOpen={false}>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Rs"
                value={filters.minPrice || ''}
                onChange={e => onChange({ minPrice: Number(e.target.value) || undefined })}
                className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <input
                type="number"
                placeholder="Max Rs"
                value={filters.maxPrice || ''}
                onChange={e => onChange({ maxPrice: Number(e.target.value) || undefined })}
                className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Category" defaultOpen={false}>
            <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => onChange({
                    categoryId: filters.categoryId === c.id ? undefined : c.id,
                  })}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background: filters.categoryId === c.id
                      ? 'rgba(255,77,0,0.1)' : 'transparent',
                    color: filters.categoryId === c.id
                      ? '#FF7A3D' : 'rgba(255,255,255,0.55)',
                  }}>
                  <span>{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </aside>
    </>
  )
}
