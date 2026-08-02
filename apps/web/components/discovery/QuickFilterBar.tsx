'use client'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { SearchFilters } from '../../types/discovery'

interface Props {
  filters:    SearchFilters
  categories: { id: string; name: string; icon: string }[]
  onChange:   (partial: Partial<SearchFilters>) => void
  onReset:    () => void
}

const QUICK_TOGGLES = [
  { key: 'verified' as const,     label: 'Verified'          },
  { key: 'topRated' as const,     label: 'Top Rated'         },
  { key: 'inStock' as const,      label: 'In Stock'          },
  { key: 'fastResponse' as const, label: 'Fast Response'     },
]

export default function QuickFilterBar({ filters, categories, onChange, onReset }: Props) {
  const activeCount = [
    filters.verified, filters.topRated, filters.inStock, filters.fastResponse,
    filters.categoryId, filters.minPrice, filters.maxPrice, filters.sellerType,
  ].filter(Boolean).length

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border border-border px-3 py-2"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 50%), radial-gradient(circle at 100% 50%, rgba(245,158,11,0.06), transparent 30%), var(--bg-elevated)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <SlidersHorizontal size={13} className="text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
          Filters
        </span>
      </div>

      <select
        value={filters.categoryId || ''}
        onChange={e => onChange({ categoryId: e.target.value || undefined })}
        className="max-w-[150px] rounded-full px-2.5 py-1.5 text-[11px] font-semibold flex-shrink-0 focus:outline-none cursor-pointer"
        style={{
          background: filters.categoryId
            ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
            : 'var(--bg-elevated)',
          border: filters.categoryId
            ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
            : '1px solid var(--border-color)',
          color: filters.categoryId ? 'var(--accent)' : 'var(--text-tertiary)',
        }}>
        <option value="" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
          All Categories
        </option>
        {categories.map(c => (
          <option key={c.id} value={c.id}
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
            {c.name}
          </option>
        ))}
      </select>

      {QUICK_TOGGLES.map(t => {
        const active = !!filters[t.key]
        return (
          <button
            key={t.key}
            onClick={() => onChange({ [t.key]: !active })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all duration-200"
            style={{
              background: active
                ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                : 'var(--bg-elevated)',
              border: active
                ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
                : '1px solid var(--border-color)',
              color: active ? 'var(--accent)' : 'var(--text-tertiary)',
            }}>
            <span className={active ? 'opacity-100' : 'opacity-0'}>✓</span>
            {t.label}
          </button>
        )
      })}

      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all hover:text-accent"
          style={{ color: 'var(--text-tertiary)' }}>
          <RotateCcw size={11} />
          Reset
        </button>
      )}
    </div>
  )
}
