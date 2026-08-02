'use client'
import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal, X, MapPin, Navigation } from 'lucide-react'
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
    <div className="border-b py-3" style={{ borderColor: 'var(--border-color)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
          {title}
        </span>
        {open
          ? <ChevronUp size={13} className="text-text-tertiary" />
          : <ChevronDown size={13} className="text-text-tertiary" />
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
          fixed top-0 left-0 h-full z-50
          w-72 overflow-y-auto no-scrollbar
          transition-transform duration-300 ease-in-out
          pt-4
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border-color)',
        }}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-accent" />
            <span className="text-sm font-bold text-text-primary">Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset}
              className="text-[10px] text-text-tertiary hover:text-text-primary">
              Reset
            </button>
            <button onClick={onClose} className="lg:hidden text-text-tertiary hover:text-primary">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4">
          <FilterSection title="Sort By">
            <select
              value={filters.sortBy || 'relevance'}
              onChange={e => onChange({ sortBy: e.target.value as any })}
              className="w-full rounded-xl px-3 py-2 text-xs text-text-primary"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
              }}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}
                  style={{ background: 'var(--bg-base)' }}>
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
                        ? 'var(--accent)' : 'var(--bg-elevated)',
                      border: filters[f.key]
                        ? 'none' : '1px solid var(--border-color)',
                    }}>
                    {filters[f.key] && (
                      <span className="text-[8px] text-text-primary font-black">&check;</span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary group-hover:text-text-primary">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Location" defaultOpen={!!filters.lat}>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      () => onChange({ lat: undefined, lng: undefined }),
                    )
                  }
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all"
                style={{
                  background: filters.lat ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-elevated)',
                  border: `1px solid ${filters.lat ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border-color)'}`,
                  color: filters.lat ? 'var(--accent)' : 'rgba(255,255,255,0.65)',
                }}>
                <Navigation size={12} />
                {filters.lat ? 'Using My Location' : 'Use My Location'}
              </button>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="City"
                  value={filters.city || ''}
                  onChange={e => onChange({ city: e.target.value || undefined })}
                  className="w-full rounded-xl px-3 py-2 text-xs text-text-primary placeholder-white/25 focus:outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                />
                <input
                  type="text" placeholder="State"
                  value={filters.state || ''}
                  onChange={e => onChange({ state: e.target.value || undefined })}
                  className="w-full rounded-xl px-3 py-2 text-xs text-text-primary placeholder-white/25 focus:outline-none"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary mb-1 block">Radius: {filters.kmRadius ?? 50} km</label>
                <input
                  type="range" min={5} max={500} step={5}
                  value={filters.kmRadius ?? 50}
                  onChange={e => onChange({ kmRadius: Number(e.target.value) })}
                  className="w-full accent-accent"
                  style={{ accentColor: 'var(--accent)' }}
                />
              </div>
              {filters.lat && (
                <button
                  onClick={() => onChange({ lat: undefined, lng: undefined, kmRadius: undefined })}
                  className="text-[10px] text-text-tertiary hover:text-gray-600 underline">
                  Clear location
                </button>
              )}
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
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'var(--bg-elevated)',
                    border: filters.sellerType === t.value
                      ? '1px solid color-mix(in srgb, var(--accent) 35%, transparent)'
                      : '1px solid var(--border-color)',
                    color: filters.sellerType === t.value
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
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
                className="w-full rounded-xl px-3 py-2 text-xs text-text-primary placeholder-white/25 focus:outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
              />
              <input
                type="number"
                placeholder="Max Rs"
                value={filters.maxPrice || ''}
                onChange={e => onChange({ maxPrice: Number(e.target.value) || undefined })}
                className="w-full rounded-xl px-3 py-2 text-xs text-text-primary placeholder-white/25 focus:outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
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
                      ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                    color: filters.categoryId === c.id
                      ? 'var(--accent)' : 'var(--text-secondary)',
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
