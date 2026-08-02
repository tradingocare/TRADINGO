'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Mic, Camera, X, Clock,
  TrendingUp,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SearchFilters, SearchMode } from '../../types/discovery'
import api from '../../lib/api/client'
import { SEARCH_PLACEHOLDERS, SEARCH_MODES } from '@/data/master-data'

const PLACEHOLDERS = SEARCH_PLACEHOLDERS

const MODES = SEARCH_MODES

interface Props {
  initialFilters: SearchFilters
  onSearch:       (filters: Partial<SearchFilters>) => void
  isLoading?:     boolean
  geoBanner?:     ReactNode
}

export default function SearchBar({
  initialFilters, onSearch, isLoading, geoBanner,
}: Props) {
  const [query, setQuery]         = useState(initialFilters.q || '')
  const [mode, setMode]           = useState<SearchMode>(initialFilters.mode || 'all')
  const [suggestions, setSugg]    = useState<any>(null)
  const [showSugg, setShowSugg]   = useState(false)
  const [phIdx, setPhIdx]         = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setSugg(null); return }
    const t = setTimeout(async () => {
      try {
        const res: any = await api.get(
          `/search-ai/autocomplete?q=${encodeURIComponent(query)}&limit=6`
        )
        setSugg(res.data || res)
      } catch {}
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  const submit = (q = query) => {
    if (!q.trim()) return
    setShowSugg(false)
    onSearch({ q: q.trim(), mode, page: 1 })
  }

  return (
    <div className="relative w-full max-w-[1500px] mx-auto">
      <div className="relative flex items-stretch rounded-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 44%), radial-gradient(circle at 12% 0%, rgba(255,77,0,0.10), transparent 34%), radial-gradient(circle at 88% 100%, rgba(245,158,11,0.08), transparent 28%), var(--bg-elevated)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(255,255,255,0.03)',
        }}>
        <div className="hidden sm:flex items-center border-r"
          style={{ borderColor: 'var(--border-color)' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="px-3 h-full text-xs font-semibold transition-all"
              style={{
                color: mode === m.key ? 'var(--accent)' : 'var(--text-tertiary)',
                background: mode === m.key ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center pl-4">
          {isLoading
            ? <LoadingSpinner size="sm" color="accent" />
            : <Search size={18} className="text-accent" />
          }
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSugg(true) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          onFocus={() => query.length >= 2 && setShowSugg(true)}
          placeholder={PLACEHOLDERS[phIdx]}
          className="flex-1 bg-transparent text-text-primary text-sm sm:text-base placeholder-white/30 focus:outline-none px-3 py-4"
        />

        {query && (
          <button onClick={() => { setQuery(''); setSugg(null) }}
            className="px-2 text-text-tertiary hover:text-primary transition-colors"
            aria-label="Clear search">
            <X size={16} />
          </button>
        )}

        <button className="px-3 text-text-tertiary hover:text-accent transition-colors"
          aria-label="Voice search">
          <Mic size={17} />
        </button>

        <button className="px-3 text-text-tertiary hover:text-accent transition-colors border-l hidden sm:flex items-center"
          style={{ borderColor: 'var(--border-color)' }}
          aria-label="Search by image">
          <Camera size={17} />
        </button>

        <button
          onClick={() => submit()}
          className="px-5 font-bold text-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #00CCCC)',
            color: '#fff',
          }}>
          Search
        </button>
      </div>

      {geoBanner}

      <AnimatePresence>
        {showSugg && suggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 44%), radial-gradient(circle at 16% 0%, rgba(255,77,0,0.10), transparent 34%), radial-gradient(circle at 84% 100%, rgba(245,158,11,0.08), transparent 30%), var(--bg-elevated)',
              backdropFilter: 'blur(28px)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
            {!!suggestions.trending?.length && (
              <div className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary mb-2 px-2">
                  Trending
                </p>
                {suggestions.trending.map((t: any) => (
                  <button key={t.text}
                    onClick={() => { setQuery(t.text); submit(t.text) }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-secondary text-left transition-all">
                    <TrendingUp size={13} className="text-accent" />
                    <span className="text-text-primary text-sm">{t.text}</span>
                    <span className="text-text-tertiary text-xs ml-auto">
                      {t.searchCount?.toLocaleString()} searches
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!!suggestions.products?.length && (
              <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary mb-2 px-2">
                  Products
                </p>
                {suggestions.products.map((p: any) => (
                  <button key={p.id}
                    onClick={() => { setQuery(p.name); submit(p.name) }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-surface-secondary text-left transition-all">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-secondary">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                            <Search size={14} />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm truncate">{p.name}</p>
                      <p className="text-text-tertiary text-xs">
                        Rs {p.price}/{p.unit}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!!suggestions.categories?.length && (
              <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary mb-2 px-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2 px-2">
                  {suggestions.categories.map((c: any) => (
                    <button key={c.id}
                      onClick={() => {
                        onSearch({ categoryId: c.id, q: '', page: 1 })
                        setShowSugg(false)
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all bg-bg-elevated"
                      style={{
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}>
                      <span>{c.icon}</span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!suggestions.recent?.length && (
              <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary mb-2 px-2">
                  Recent
                </p>
                {suggestions.recent.map((r: string) => (
                  <button key={r}
                    onClick={() => { setQuery(r); submit(r) }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-surface-secondary text-left transition-all">
                    <Clock size={13} className="text-text-tertiary flex-shrink-0" />
                    <span className="text-text-secondary text-sm">{r}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
