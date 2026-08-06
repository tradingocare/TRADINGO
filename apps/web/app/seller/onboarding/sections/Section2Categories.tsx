'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../lib/api/client'
import type { SectionProps, CategoryNode } from '../../../../types/vendor-onboarding'
import { Search, X, ChevronDown, ChevronRight, Star } from 'lucide-react'

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
      .catch(() => { console.error('Failed to load categories'); })
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
          .catch(() => { console.error('Category search failed'); })
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
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}>
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.slug)} className="text-text-tertiary hover:text-text-secondary">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <div className="w-4" />}
          {node.icon && <span className="text-sm">{node.icon}</span>}
          <span className="flex-1 text-text-secondary text-sm truncate">{node.name}</span>
          <span className="text-text-tertiary text-xs">{node.productCount}</span>
          <button onClick={() => toggleCategory(node.slug)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all bg-surface"
            style={{
              background: isSelected ? 'rgba(245, 158, 11, 0.15)' : '',
              border: isSelected ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
              color: isSelected ? '#f59e0b' : 'rgba(255,255,255,0.5)',
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
            className="w-full px-10 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b] transition-colors"
            placeholder="Search categories..." />
        </div>

        {searchResults.length > 0 ? (
          <div className="space-y-1">
            {searchResults.map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface transition-colors">
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                <span className="flex-1 text-text-secondary text-sm">{cat.name}</span>
                <button onClick={() => toggleCategory(cat.slug)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all bg-surface"
                    style={{
                      background: selected.includes(cat.slug) ? 'rgba(245, 158, 11, 0.15)' : '',
                      border: '1px solid var(--border-color)',
                      color: selected.includes(cat.slug) ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                    }}>
                  {selected.includes(cat.slug) ? 'Added' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-surface border border-border max-h-[500px] overflow-y-auto">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-text-tertiary hover:text-text-secondary">Back</button>}
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            onClick={save} disabled={saving || selected.length === 0}
            className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
            {saving ? 'Saving...' : `Save (${selected.length}) & Continue`}
          </motion.button>
        </div>
      </div>

      <div>
        <div className="rounded-xl bg-surface border border-border p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-3">
            Selected Categories ({selected.length}/10)
          </h3>
          {selected.length === 0 ? (
            <p className="text-text-tertiary text-xs">No categories selected yet. Browse and add categories from the left panel.</p>
          ) : (
            <div className="space-y-2">
              {selected.map((slug, i) => {
                const cat = tree.find(c => c.slug === slug) || searchResults.find(c => c.slug === slug)
                return (
                  <div key={slug}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all bg-surface" style={{ background: i === 0 ? 'rgba(245, 158, 11, 0.08)' : '', border: '1px solid var(--border-color)' }}>
                    {i === 0 && <Star size={12} className="text-[#f59e0b] flex-shrink-0" />}
                    <span className="flex-1 text-text-secondary text-xs truncate">{cat?.name || slug}</span>
                    <button onClick={() => setSelected(prev => prev.filter(s => s !== slug))}
                      className="text-text-tertiary hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {selected.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-surface">
              <p className="text-text-tertiary text-[10px] font-semibold mb-2">📊 Market Insight</p>
              <p className="text-text-secondary text-xs">Selected categories will be used to match your products with buyer searches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
