'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Loader2, ChevronLeft, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { CopilotPanel } from '@/components/ai/copilot-panel'
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

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
  if (!product) return null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} className="text-gray-600" /></button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500">{product.slug}</p>
        </div>
        <button onClick={() => setShowCopilot(!showCopilot)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showCopilot ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}>
          <Sparkles className="h-4 w-4" /> AI Copilot
        </button>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 space-y-6 transition-all ${showCopilot ? 'max-w-3xl' : 'max-w-3xl mx-auto'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Brand</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Model</label>
                <input value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (₹)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">MOQ</label>
                <input type="number" value={moq} onChange={e => setMoq(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit</label>
                <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Short Description</label>
              <textarea value={shortDescription} onChange={e => setShortDescription(e.target.value)} rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                status === 'PENDING_APPROVAL' ? 'bg-yellow-50 text-yellow-700' :
                status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                'bg-gray-100 text-gray-500'
              }`}>{status}</span>
              <button onClick={handleSave} disabled={saving || !name.trim()}
                className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>

        {showCopilot && (
          <div className="w-72 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
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
            {aiCache && aiCache.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Recent Suggestions</h3>
                <div className="space-y-2">
                  {aiCache.slice(0, 5).map(c => (
                    <div key={c.id} className="rounded-lg border border-gray-100 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-orange-600 uppercase">{c.cacheType.replace(/_/g, ' ')}</span>
                        {c.accepted && <span className="text-[10px] text-green-600 font-medium">Accepted</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{JSON.stringify(c.response).slice(0, 60)}...</p>
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
