'use client'

import { useState, useEffect, useRef } from 'react'
import { getBrands } from '@/lib/api/enterprise-catalog'
import { Input } from '@/components/ui/input'
import { Loader2, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BrandOption {
  id: string
  name: string
  slug: string
  country?: string | null
  verificationStatus?: string
  logo?: string | null
}

interface BrandSelectProps {
  value: string
  onChange: (brandId: string, brandName: string) => void
  placeholder?: string
  className?: string
}

export function BrandSelect({ value, onChange, placeholder = 'Search brand...', className }: BrandSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [selected, setSelected] = useState<BrandOption | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) { setBrands([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await getBrands({ search: query }) as any
        const list = Array.isArray(res) ? res : res?.data || []
        setBrands(list.map((b: any) => ({
          id: b.id, name: b.name, slug: b.slug,
          country: b.country, verificationStatus: b.verificationStatus, logo: b.logo,
        })))
      } catch { setBrands([]) }
      finally { setLoading(false) }
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (value && !selected) {
      getBrands({ search: value }).then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || []
        const match = list.find((b: any) => b.name === value || b.id === value)
        if (match) setSelected({ id: match.id, name: match.name, slug: match.slug, country: match.country, verificationStatus: match.verificationStatus, logo: match.logo })
      }).catch((err) => console.error('Failed to resolve brand:', err))
    }
  }, [value])

  const handleSelect = (brand: BrandOption) => {
    setSelected(brand)
    setQuery('')
    setOpen(false)
    onChange(brand.id, brand.name)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onChange('', '')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {selected ? (
        <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm">
          <span className="flex-1 truncate text-text-primary">{selected.name}</span>
          {selected.verificationStatus === 'VERIFIED' && (
            <span className="text-xs text-status-success font-medium">✓ Verified</span>
          )}
          <button onClick={handleClear} className="text-text-tertiary hover:text-text-primary ml-auto text-lg leading-none">&times;</button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pl-9"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-text-tertiary" />}
        </div>
      )}
      {open && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-text-tertiary">Searching...</div>
          ) : brands.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-tertiary">No brands found. Type to search.</div>
          ) : (
            brands.map(brand => (
              <button
                key={brand.id}
                onClick={() => handleSelect(brand)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg-elevated transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary truncate">{brand.name}</span>
                    {brand.verificationStatus === 'VERIFIED' && (
                      <span className="text-xs text-status-success shrink-0">✓</span>
                    )}
                  </div>
                  {brand.country && <div className="text-xs text-text-tertiary truncate">{brand.country}</div>}
                </div>
                {selected?.id === brand.id && <Check className="h-4 w-4 text-accent shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
