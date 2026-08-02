'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Tag, Search, Hash, Lightbulb } from 'lucide-react'
import { generateHighlights, generateTags, suggestHsnGst, generateMetaKeywords, type HighlightsResponse, type TagsResponse, type HsnGstResponse, type MetaKeywordsResponse } from '@/lib/api/ai'
import { useToast } from '@/components/ui/use-toast'

interface AiHighlightsProps {
  productId: string
  productName?: string
}

type TabType = 'highlights' | 'tags' | 'hsn' | 'seo'

export function AiHighlights({ productId }: AiHighlightsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('highlights')
  const [highlights, setHighlights] = useState<HighlightsResponse | null>(null)
  const [tags, setTags] = useState<TagsResponse | null>(null)
  const [hsn, setHsn] = useState<HsnGstResponse | null>(null)
  const [seo, setSeo] = useState<MetaKeywordsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const tabs: { key: TabType; label: string; icon: typeof Sparkles }[] = [
    { key: 'highlights', label: 'Highlights', icon: Lightbulb },
    { key: 'tags', label: 'Tags', icon: Tag },
    { key: 'hsn', label: 'HSN/GST', icon: Hash },
    { key: 'seo', label: 'SEO Meta', icon: Search },
  ]

  const handleGenerate = async (tab: TabType) => {
    setLoading(true)
    setError(null)
    try {
      switch (tab) {
        case 'highlights': {
          const r = await generateHighlights({ productId })
          setHighlights(r)
          break
        }
        case 'tags': {
          const r = await generateTags({ productId, count: 10 })
          setTags(r)
          break
        }
        case 'hsn': {
          const r = await suggestHsnGst({ productId })
          setHsn(r)
          break
        }
        case 'seo': {
          const r = await generateMetaKeywords({ productId })
          setSeo(r)
          break
        }
      }
    } catch {
      setError(`Failed to generate ${tab}`)
      toast({ title: 'Error', description: `Failed to generate ${tab}`, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (!getData(tab.key)) handleGenerate(tab.key) }}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-3 min-h-[80px]">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Generating {activeTab}...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <span>{error}</span>
            <button onClick={() => handleGenerate(activeTab)} className="text-accent underline">Retry</button>
          </div>
        ) : activeTab === 'highlights' && highlights ? (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-text-tertiary mb-1 font-medium">Key Highlights</p>
              <ul className="space-y-1">
                {highlights.highlights.slice(0, 5).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary"><Sparkles className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />{h}</li>
                ))}
              </ul>
            </div>
            {highlights.keySellingPoints?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-text-tertiary mb-1 font-medium">Selling Points</p>
                <div className="flex flex-wrap gap-1">
                  {highlights.keySellingPoints.map((sp, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{sp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'tags' && tags ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-secondary border border-border text-xs text-text-secondary">
                <Tag className="h-3 w-3" />{t}
              </span>
            ))}
          </div>
        ) : activeTab === 'hsn' && hsn ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">HSN Code</p>
              <p className="text-lg font-bold text-text-primary font-mono">{hsn.hsnCode}</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">GST Rate</p>
              <p className="text-lg font-bold text-text-primary">{hsn.gstRate}%</p>
            </div>
            <div className="col-span-2 p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">Description</p>
              <p className="text-sm text-text-primary">{hsn.description}</p>
            </div>
          </div>
        ) : activeTab === 'seo' && seo ? (
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">Meta Title</p>
              <p className="text-sm text-text-primary">{seo.metaTitle}</p>
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">Meta Description</p>
              <p className="text-sm text-text-primary">{seo.metaDescription}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <p className="text-xs text-text-tertiary w-full mb-1">Keywords</p>
              {seo.metaKeywords.map((kw, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">{kw}</span>
              ))}
            </div>
            <div className="p-2 rounded-lg bg-surface-secondary border border-border">
              <p className="text-xs text-text-tertiary mb-0.5">Focus Keyphrase</p>
              <p className="text-sm font-medium text-text-primary">{seo.focusKeyphrase}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">Click a tab to generate AI insights</p>
        )}
      </div>
    </div>
  )

  function getData(tab: TabType) {
    switch (tab) {
      case 'highlights': return highlights
      case 'tags': return tags
      case 'hsn': return hsn
      case 'seo': return seo
    }
  }
}