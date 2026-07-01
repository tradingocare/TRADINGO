'use client'
import { useState, useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api-client'

interface AiActionButtonProps {
  label: string
  loading: boolean
  onClick: () => void
  variant?: 'primary' | 'ghost'
}

export function AiActionButton({ label, loading, onClick, variant = 'ghost' }: AiActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        variant === 'primary'
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'border border-orange-500/20 text-orange-400 hover:bg-orange-500/10'
      }`}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {label}
    </button>
  )
}

export function useWizardAi() {
  const { toast } = useToast()
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})

  const handleAiGenerate = useCallback(
    async (action: string, apiCall: () => Promise<any>, onResult: (data: any) => void) => {
      setAiLoading((prev) => ({ ...prev, [action]: true }))
      try {
        const res = await apiCall()
        const data = res?.data ?? res ?? {}
        onResult(data)
        toast({ title: 'AI Complete', description: `${action} generated successfully`, variant: 'default' })
      } catch (err: any) {
        toast({ title: 'AI Failed', description: err?.message || `Could not ${action}`, variant: 'destructive' })
      } finally {
        setAiLoading((prev) => ({ ...prev, [action]: false }))
      }
    },
    [toast],
  )

  return { aiLoading, handleAiGenerate }
}

function buildContext(v: Record<string, any>): Record<string, unknown> {
  return {
    name: v.name || '',
    categoryId: v.categoryId || '',
    brand: v.brand || '',
    model: v.model || '',
    sku: v.sku || '',
    hsCode: v.hsCode || '',
    gtin: v.gtin || '',
    unit: v.unit || '',
    moq: v.moq || 0,
    shortDescription: v.shortDescription || '',
    description: v.description || '',
    productType: v.productType || 'PHYSICAL',
  }
}

export function WizardCopilot({
  currentStep,
  formValues,
  aiLoading,
  onGenerate,
}: {
  currentStep: number
  formValues: Record<string, any>
  aiLoading: Record<string, boolean>
  onGenerate: (action: string, apiCall: () => Promise<any>, onResult: (data: any) => void) => void
}) {
  const v = formValues
  const ctx = buildContext(v)

  const actions = getStepActions(currentStep, ctx, onGenerate)
  if (!actions.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-orange-500/10 bg-orange-500/[0.03] px-4 py-3">
      <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" />
      <span className="text-xs font-medium text-orange-400/80 mr-1">AI</span>
      {actions.map((a) => (
        <AiActionButton key={a.key} label={a.label} loading={!!aiLoading[a.key]} onClick={a.onClick} />
      ))}
    </div>
  )
}

function getStepActions(
  step: number,
  ctx: Record<string, unknown>,
  onGenerate: (action: string, apiCall: () => Promise<any>, onResult: (data: any) => void) => void,
) {
  switch (step) {
    case 1:
      return [
        {
          key: 'generateDescription',
          label: 'Generate Description',
          onClick: () =>
            onGenerate(
              'generateDescription',
              () => apiClient.post('/ai/products/generate-description', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (data?.description) {
                  const desc = typeof data.description === 'string' ? data.description : data.description?.content || ''
                  const short = typeof data.shortDescription === 'string' ? data.shortDescription : data.description?.shortDescription || desc.slice(0, 200)
                  if (typeof window !== 'undefined') {
                    const evt = new CustomEvent('wizard-ai-fill', { detail: { description: desc, shortDescription: short } })
                    window.dispatchEvent(evt)
                  }
                }
              },
            ),
        },
        {
          key: 'suggestSeo',
          label: 'Suggest SEO',
          onClick: () =>
            onGenerate(
              'suggestSeo',
              () => apiClient.post('/ai/products/generate-seo', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { seo: data } }))
                }
              },
            ),
        },
        {
          key: 'suggestHsCode',
          label: 'Auto-fill HS Code',
          onClick: () =>
            onGenerate(
              'suggestHsCode',
              () => apiClient.post('/ai/products/suggest-specs', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (data?.hsCode && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { hsCode: data.hsCode } }))
                }
              },
            ),
        },
      ]
    case 2:
      return [
        {
          key: 'suggestSpecs',
          label: 'Suggest Specs',
          onClick: () =>
            onGenerate(
              'suggestSpecs',
              () => apiClient.post('/ai/products/suggest-specs', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (data?.specs && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { specs: data.specs } }))
                }
              },
            ),
        },
      ]
    case 3:
      return [
        {
          key: 'suggestImages',
          label: 'Suggest Image Types',
          onClick: () =>
            onGenerate(
              'suggestImages',
              () => apiClient.post('/ai/products/suggest-images', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { imageSuggestions: data } }))
                }
              },
            ),
        },
      ]
    case 4:
      return [
        {
          key: 'suggestPricing',
          label: 'Suggest Pricing',
          onClick: () =>
            onGenerate(
              'suggestPricing',
              () => apiClient.post('/ai/products/generate-description', { ...ctx, productId: ctx.draftId || '' }),
              (data) => {
                if (data?.pricing && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { pricing: data.pricing } }))
                }
              },
            ),
        },
      ]
    case 6:
      return [
        {
          key: 'translateHi',
          label: 'Hindi',
          onClick: () =>
            onGenerate(
              'translateHi',
              () => apiClient.post('/ai/products/translate', { ...ctx, productId: ctx.draftId || '', targetLocale: 'hi' }),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { translation: { locale: 'hi', ...data } } }))
                }
              },
            ),
        },
        {
          key: 'translateAr',
          label: 'Arabic',
          onClick: () =>
            onGenerate(
              'translateAr',
              () => apiClient.post('/ai/products/translate', { ...ctx, productId: ctx.draftId || '', targetLocale: 'ar' }),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { translation: { locale: 'ar', ...data } } }))
                }
              },
            ),
        },
        {
          key: 'translateFr',
          label: 'French',
          onClick: () =>
            onGenerate(
              'translateFr',
              () => apiClient.post('/ai/products/translate', { ...ctx, productId: ctx.draftId || '', targetLocale: 'fr' }),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { translation: { locale: 'fr', ...data } } }))
                }
              },
            ),
        },
      ]
    case 7:
      return [
        {
          key: 'calculateScore',
          label: 'Calculate Score',
          onClick: () =>
            onGenerate(
              'calculateScore',
              () => apiClient.post(`/ai/quality/calculate/${ctx.draftId || ''}`, {}),
              (data) => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('wizard-ai-fill', { detail: { score: data } }))
                }
              },
            ),
        },
      ]
    default:
      return []
  }
}
