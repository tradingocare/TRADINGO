'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { ChevronLeft, Sparkles, BarChart3, Award, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { CopilotPanel } from '@/components/ai/copilot-panel'
import { BrandSelect } from '@/components/enterprise-catalog/brand-select'
import { QualityBadge } from '@/components/enterprise-catalog/quality-badge'
import { CompletenessSummary } from '@/components/enterprise-catalog/completeness-summary'
import { SeoSummary } from '@/components/enterprise-catalog/seo-summary'
import { DuplicateStatus } from '@/components/enterprise-catalog/duplicate-status'
import { CommerceConfidence } from '@/components/enterprise-catalog/commerce-confidence'
import { AiImprovements } from '@/components/enterprise-catalog/ai-improvements'
import { useScore } from '@/hooks/use-catalog-quality'
import {
  useGenerateDescription, useGenerateSeo, useSuggestSpecs, useSuggestImages,
  useTranslateProduct, useAiCache, useAcceptSuggestion,
} from '@/hooks/use-ai'

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCopilot, setShowCopilot] = useState(false)
  const [generatingAction, setGeneratingAction] = useState<string | null>(null)

  const genDesc = useGenerateDescription()
  const genSeo = useGenerateSeo()
  const suggestSpecs = useSuggestSpecs()
  const suggestImages = useSuggestImages()
  const translateProd = useTranslateProduct()
  const { data: aiCache, refetch: refetchCache } = useAiCache(id as string)
  const acceptSuggestion = useAcceptSuggestion()
  const { data: qualityScore } = useScore(id as string)

  useEffect(() => {
    if (!id) return
    api.get(`/seller/products/${id}`)
      .then(res => setProduct(res.data?.data || res.data))
      .catch(() => {
        toast({ title: 'Failed to load product', variant: 'destructive' })
        router.push('/seller/products')
      })
      .finally(() => setLoading(false))
  }, [id])

  const [name, setName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [sku, setSku] = useState('')
  const [moq, setMoq] = useState(1)
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setShortDescription(product.shortDescription || '')
      setDescription(product.description || '')
      setBrand(product.brand || '')
      setModel(product.model || '')
      setSku(product.sku || '')
      setMoq(product.moq || 1)
      setUnit(product.unit || '')
      setPrice(product.originalPrice || '')
      setStatus(product.status || '')
    }
  }, [product])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/seller/products/${id}`, { name, shortDescription, description, brand, model, sku, moq, unit, originalPrice: price ? Number(price) : undefined })
      toast({ title: 'Product updated successfully' })
      router.push('/seller/products')
    } catch {
      toast({ title: 'Failed to save product', variant: 'destructive' })
    }
    finally { setSaving(false) }
  }

  const wrapAiAction = async (action: string, fn: () => Promise<any>) => {
    setGeneratingAction(action)
    try {
      const result = await fn()
      toast({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} generated successfully` })
      refetchCache()
      if (result?.suggestions?.shortDescription) setShortDescription(result.suggestions.shortDescription)
      if (result?.suggestions?.longDescription) setDescription(result.suggestions.longDescription)
      if (result?.suggestions?.seoTitle) setName(result.suggestions.seoTitle)
    } catch {
      toast({ title: `Failed to generate ${action}`, variant: 'destructive' })
    } finally {
      setGeneratingAction(null)
    }
  }

  const handleGenerateDescription = () => wrapAiAction('description', () => genDesc.mutateAsync({ productId: id as string }))
  const handleGenerateSeo = () => wrapAiAction('seo', () => genSeo.mutateAsync({ productId: id as string }))
  const handleSuggestSpecs = () => wrapAiAction('specs', () => suggestSpecs.mutateAsync({ productId: id as string }))
  const handleSuggestImages = () => wrapAiAction('images', () => suggestImages.mutateAsync({ productId: id as string }))
  const handleTranslate = (locale: string) => wrapAiAction('translate', () => translateProd.mutateAsync({ productId: id as string, targetLocale: locale }))

  if (loading) return <LoadingSpinner size="xl" />
  if (!product) return null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-surface-secondary" aria-label="Back to products"><ChevronLeft size={18} className="text-text-secondary" /></button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-text-primary">Edit Product</h1>
          <p className="text-sm text-text-tertiary">{product.slug}</p>
        </div>
        <button onClick={() => setShowCopilot(!showCopilot)} aria-label="Toggle AI Copilot"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${showCopilot ? 'bg-accent-500 text-text-primary' : 'bg-accent-500/10 text-accent-500 hover:bg-accent-500/20'
            }`}>
          <Sparkles className="h-4 w-4" /> AI Copilot
        </button>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 space-y-6 transition-all ${showCopilot ? 'max-w-3xl' : 'max-w-3xl mx-auto'}`}>
          <div className="rounded-[22px] p-6 space-y-5 bg-bg-elevated border border-border">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="product-name" className="text-xs font-semibold text-text-tertiary mb-1 block">Product Name</label>
                <input id="product-name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter product name" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label htmlFor="product-brand" className="text-xs font-semibold text-text-tertiary mb-1 block">Brand</label>
                <BrandSelect value={brand} onChange={(_, name) => setBrand(name)} placeholder="Enter brand" />
              </div>
              <div>
                <label htmlFor="product-model" className="text-xs font-semibold text-white/50 mb-1 block">Model</label>
                <input id="product-model" value={model} onChange={e => setModel(e.target.value)} placeholder="Enter model" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label htmlFor="product-sku" className="text-xs font-semibold text-white/50 mb-1 block">SKU</label>
                <input id="product-sku" value={sku} onChange={e => setSku(e.target.value)} placeholder="Enter SKU" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label htmlFor="product-price" className="text-xs font-semibold text-white/50 mb-1 block">Price (?)</label>
                <input id="product-price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label htmlFor="product-moq" className="text-xs font-semibold text-white/50 mb-1 block">MOQ</label>
                <input id="product-moq" type="number" value={moq} onChange={e => setMoq(Number(e.target.value))} placeholder="1" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label htmlFor="product-unit" className="text-xs font-semibold text-white/50 mb-1 block">Unit</label>
                <input id="product-unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., piece, kg" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface" style={{ border: '1px solid var(--border-color)' }} />
              </div>
            </div>

            <div>
              <label htmlFor="product-short-desc" className="text-xs font-semibold text-white/50 mb-1 block">Short Description</label>
              <textarea id="product-short-desc" value={shortDescription} onChange={e => setShortDescription(e.target.value)} rows={2}
                placeholder="Brief overview" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface resize-none" style={{ border: '1px solid var(--border-color)' }} />
            </div>
            <div>
              <label htmlFor="product-desc" className="text-xs font-semibold text-white/50 mb-1 block">Full Description</label>
              <textarea id="product-desc" value={description} onChange={e => setDescription(e.target.value)} rows={5}
                placeholder="Detailed product description" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder:text-white/35 bg-surface resize-none" style={{ border: '1px solid var(--border-color)' }} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === 'ACTIVE' ? 'bg-green-500/15 text-green-400' :
                  status === 'PENDING_APPROVAL' ? 'bg-yellow-500/15 text-yellow-400' :
                    status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                      status === 'DRAFT' ? 'bg-surface-secondary text-text-secondary' :
                        'bg-surface text-text-tertiary'
                }`}>{status}</span>
              <button onClick={handleSave} disabled={saving || !name.trim()}
                className="px-6 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-500/90 disabled:opacity-50 flex items-center gap-2">
                {saving && <LoadingSpinner size="xs" />} Save Changes
              </button>
            </div>
          </div>
        </div>

        {showCopilot && (
          <div className="w-80 shrink-0 space-y-4">
            {qualityScore && (
              <div className="rounded-[22px] p-3 bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold text-text-secondary">Product Intelligence</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <QualityBadge score={qualityScore.total} size="md" showLabel />
                  <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${qualityScore.total >= 70 ? 'bg-emerald-500' : qualityScore.total >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${qualityScore.total}%` }} />
                  </div>
                </div>
                <CompletenessSummary productId={id as string} compact />
              </div>
            )}
            <div className="rounded-[22px] p-4 bg-surface border border-border">
              <CopilotPanel
                productId={id as string}
                onGenerateDescription={handleGenerateDescription}
                onGenerateSeo={handleGenerateSeo}
                onSuggestSpecs={handleSuggestSpecs}
                onSuggestImages={handleSuggestImages}
                onTranslate={handleTranslate}
                isGenerating={generatingAction !== null}
                generatingAction={generatingAction}
              />
            </div>
            <SeoSummary productId={id as string} />
            <CommerceConfidence productId={id as string} />
            <div className="rounded-[22px] p-3 bg-surface border border-border">
              <DuplicateStatus productId={id as string} />
            </div>
            <AiImprovements productId={id as string} />
            {aiCache && aiCache.length > 0 && (
              <div className="rounded-[22px] p-4 bg-surface border border-border">
                <h3 className="text-xs font-semibold text-text-tertiary uppercase mb-3">Recent Suggestions</h3>
                <div className="space-y-2">
                  {aiCache.slice(0, 5).map(c => (
                    <div key={c.id} className="rounded-lg p-2.5 bg-surface-secondary border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-accent uppercase">{c.cacheType.replace(/_/g, ' ')}</span>
                        {c.accepted && <span className="text-[10px] text-emerald-400 font-medium">Accepted</span>}
                      </div>
                      <p className="text-[11px] text-text-tertiary truncate">{JSON.stringify(c.response).slice(0, 60)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
