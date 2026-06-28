'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../lib/api/client'
import type { SectionProps, CategoryNode } from '../../../../types/vendor-onboarding'
import { Search, Plus, X, ChevronDown, ChevronRight, Star } from 'lucide-react'

export default function Section2Categories({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [tree, setTree] = useState<CategoryNode[]>([])
  const [selected, setSelected] = useState<string[]>(vendor?.categories || [])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/categories/tree')
      .then((r: any) => {
        const d = r.data?.data || r.data || r
        setTree(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const debouncedSearch = useCallback((() => {
    let timer: any
    return (q: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!q.trim()) { setSearchResults([]); return }
        api.get(`/categories/search/${encodeURIComponent(q)}`)
          .then((r: any) => {
            const d = r.data?.data || r.data || r
            setSearchResults(Array.isArray(d) ? d : [])
          })
          .catch(() => {})
      }, 300)
    }
  })(), [])

  const toggleCategory = (slug: string) => {
    setSelected(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug)
      if (prev.length >= 10) return prev
      return [...prev, slug]
    })
  }

  const toggleExpand = (slug: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug); else next.add(slug)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/seller/profile', { categories: selected })
      onSave({ score: selected.length > 0 ? 15 : 0 })
    } finally { setSaving(false) }
  }

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree
    const q = search.toLowerCase()
    return tree.filter(c => c.name?.toLowerCase().includes(q))
  }, [tree, search])

  const renderNode = (node: CategoryNode, depth: number = 0) => {
    const isSelected = selected.includes(node.slug)
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded = expanded.has(node.slug)

    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}>
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.slug)} className="text-white/30 hover:text-white/60">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <div className="w-4" />}
          {node.icon && <span className="text-sm">{node.icon}</span>}
          <span className="flex-1 text-white/80 text-sm truncate">{node.name}</span>
          <span className="text-white/20 text-xs">{node.productCount}</span>
          <button onClick={() => toggleCategory(node.slug)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
            style={{
              background: isSelected ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
              border: isSelected ? '1px solid rgba(255,77,0,0.35)' : '1px solid rgba(255,255,255,0.1)',
              color: isSelected ? '#FF4D00' : 'rgba(255,255,255,0.5)',
            }}>
            {isSelected ? 'Added' : '+ Add'}
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children!.map(child => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  if (loading) return <div className="text-white/40 text-center py-10">Loading categories...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h2 className="text-white font-bold text-xl mb-1">Categories</h2>
        <p className="text-white/40 text-sm mb-4">Select up to 10 categories you sell in</p>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); debouncedSearch(e.target.value) }}
            className="w-full px-10 py-3 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#FF4D00] transition-colors"
            placeholder="Search categories..." />
        </div>

        {searchResults.length > 0 ? (
          <div className="space-y-1">
            {searchResults.map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                <span className="flex-1 text-white/80 text-sm">{cat.name}</span>
                <button onClick={() => toggleCategory(cat.slug)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: selected.includes(cat.slug) ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: selected.includes(cat.slug) ? '#FF4D00' : 'rgba(255,255,255,0.5)',
                  }}>
                  {selected.includes(cat.slug) ? 'Added' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 max-h-[500px] overflow-y-auto">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            onClick={save} disabled={saving || selected.length === 0}
            className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ background:'linear-gradient(135deg,#FF4D00,#FF7A3D)', color:'#fff' }}>
            {saving ? 'Saving...' : `Save (${selected.length}) & Continue`}
          </motion.button>
        </div>
      </div>

      <div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <h3 className="text-white font-semibold text-sm mb-3">
            Selected Categories ({selected.length}/10)
          </h3>
          {selected.length === 0 ? (
            <p className="text-white/30 text-xs">No categories selected yet. Browse and add categories from the left panel.</p>
          ) : (
            <div className="space-y-2">
              {selected.map((slug, i) => {
                const cat = tree.find(c => c.slug === slug) || searchResults.find(c => c.slug === slug)
                return (
                  <div key={slug}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                    style={{ background: i === 0 ? 'rgba(255,77,0,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {i === 0 && <Star size={12} className="text-[#FF4D00] flex-shrink-0" />}
                    <span className="flex-1 text-white/80 text-xs truncate">{cat?.name || slug}</span>
                    <button onClick={() => setSelected(prev => prev.filter(s => s !== slug))}
                      className="text-white/20 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {selected.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-white/5">
              <p className="text-white/50 text-[10px] font-semibold mb-2">📊 Market Insight</p>
              <p className="text-white/80 text-xs">Selected categories will be used to match your products with buyer searches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
