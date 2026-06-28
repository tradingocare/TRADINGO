'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Mic, Camera, X, Clock,
  TrendingUp, Sparkles,
  Loader2,
} from 'lucide-react'
import { SearchFilters, SearchMode } from '../../types/discovery'
import api from '../../lib/api/client'
import { SEARCH_PLACEHOLDERS, SEARCH_MODES } from '@/data/master-data'

const PLACEHOLDERS = SEARCH_PLACEHOLDERS

const MODES = SEARCH_MODES

interface Props {
  initialFilters: SearchFilters
  onSearch:       (filters: Partial<SearchFilters>) => void
  isLoading?:     boolean
}

export default function SearchBar({
  initialFilters, onSearch, isLoading,
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
          `/v1/search-ai/autocomplete?q=${encodeURIComponent(query)}&limit=6`
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
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative flex items-stretch rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
        <div className="hidden sm:flex items-center border-r"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="px-3 h-full text-xs font-semibold transition-all"
              style={{
                color: mode === m.key ? '#FF4D00' : 'rgba(255,255,255,0.45)',
                background: mode === m.key ? 'rgba(255,77,0,0.1)' : 'transparent',
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center pl-4">
          {isLoading
            ? <Loader2 size={18} className="animate-spin" style={{ color: '#FF4D00' }} />
            : <Search size={18} style={{ color: '#FF4D00' }} />
          }
        </div>

        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSugg(true) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          onFocus={() => query.length >= 2 && setShowSugg(true)}
          placeholder={PLACEHOLDERS[phIdx]}
          className="flex-1 bg-transparent text-white text-sm sm:text-base placeholder-white/30 focus:outline-none px-3 py-4"
        />

        {query && (
          <button onClick={() => { setQuery(''); setSugg(null) }}
            className="px-2 text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        )}

        <button className="px-3 text-white/30 hover:text-[#FF4D00] transition-colors"
          title="Voice search">
          <Mic size={17} />
        </button>

        <button className="px-3 text-white/30 hover:text-[#FF4D00] transition-colors border-l hidden sm:flex items-center"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          title="Search by image">
          <Camera size={17} />
        </button>

        <button
          onClick={() => submit()}
          className="px-5 font-bold text-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)',
            color: '#fff',
          }}>
          Search
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <Sparkles size={11} style={{ color: '#FF4D00' }} />
        <span className="text-white/35 text-[10px]">
          Powered by AI — supports Hindi, English, Hinglish
        </span>
      </div>

      <AnimatePresence>
        {showSugg && suggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(15, 5, 20, 0.96)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
            {!!suggestions.trending?.length && (
              <div className="p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">
                  Trending
                </p>
                {suggestions.trending.map((t: any) => (
                  <button key={t.text}
                    onClick={() => { setQuery(t.text); submit(t.text) }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-all">
                    <TrendingUp size={13} style={{ color: '#FF4D00' }} />
                    <span className="text-white/80 text-sm">{t.text}</span>
                    <span className="text-white/25 text-xs ml-auto">
                      {t.searchCount?.toLocaleString()} searches
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!!suggestions.products?.length && (
              <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">
                  Products
                </p>
                {suggestions.products.map((p: any) => (
                  <button key={p.id}
                    onClick={() => { setQuery(p.name); submit(p.name) }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-all">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Search size={14} />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm truncate">{p.name}</p>
                      <p className="text-white/35 text-xs">
                        Rs {p.price}/{p.unit}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!!suggestions.categories?.length && (
              <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2 px-2">
                  {suggestions.categories.map((c: any) => (
                    <button key={c.id}
                      onClick={() => {
                        onSearch({ categoryId: c.id, q: '', page: 1 })
                        setShowSugg(false)
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                      }}>
                      <span>{c.icon}</span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!suggestions.recent?.length && (
              <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">
                  Recent
                </p>
                {suggestions.recent.map((r: string) => (
                  <button key={r}
                    onClick={() => { setQuery(r); submit(r) }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-all">
                    <Clock size={13} className="text-white/25 flex-shrink-0" />
                    <span className="text-white/60 text-sm">{r}</span>
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
