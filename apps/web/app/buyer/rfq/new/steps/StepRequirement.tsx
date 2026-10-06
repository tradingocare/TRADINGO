'use client';

import { useState } from 'react'
import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AiRfqCopilot } from '@/components/rfq/ai-rfq-copilot'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export function StepRequirement() {
  const { title, description, priority, visibility, expiryDays, rfqType, update } = useRfqWizardStore();
  const [showAi, setShowAi] = useState(false)
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)

  const getRfqData = () => ({ title, description, priority, visibility, rfqType })

  const handleGenerateFromText = async (text: string, language?: string) => {
    setAiGenerating('generate')
    try {
      const { generateRfqFromText } = await import('@/lib/api/ai-rfq')
      const res = await generateRfqFromText(text, language)
      const data = res.data?.data
      if (data) {
        if (data.title) update('title', data.title)
        if (data.description) update('description', data.description)
        if (data.category) update('category', data.category)
      }
    } catch (err) { console.error('Failed to generate from text:', err) }
    setAiGenerating(null)
  }

  const handleDetectMissing = async () => {
    setAiGenerating('missing')
    try {
      const { detectMissingFields } = await import('@/lib/api/ai-rfq')
      await detectMissingFields(getRfqData())
    } catch (err) { console.error('Failed to detect missing fields:', err) }
    setAiGenerating(null)
  }

  const handleQualityScore = async () => {
    setAiGenerating('quality')
    try {
      const { calculateQualityScore } = await import('@/lib/api/ai-rfq')
      await calculateQualityScore(getRfqData())
    } catch (err) { console.error('Failed to calculate quality score:', err) }
    setAiGenerating(null)
  }

  // P0-3 Step 3: the prediction result is CONSUMED, not discarded. It lands
  // in the wizard store so it flows AI prediction → store → product item →
  // submit → backend → RfqProductItem. HIGH-band results attach
  // automatically (deterministic exact/synonym — same rule the backend
  // applies); MEDIUM/LOW stay advisory (band label shown, picker
  // alternatives preserved) until the buyer confirms via the Confirm button.
  const [lastPrediction, setLastPrediction] = useState<{
    name: string;
    label: string;
    band: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    categoryId: string | null;
    subcategoryId: string | null;
    catalogItemId: string | null;
  } | null>(null)

  const handlePredictCategory = async (name: string) => {
    setAiGenerating('category')
    try {
      const { predictCategory } = await import('@/lib/api/ai-rfq')
      const res = await predictCategory(name)
      const data = res.data?.data
      if (data) {
        setLastPrediction({
          name,
          label: data.categoryName
            ? `${data.categoryName}${data.subcategoryName ? ` / ${data.subcategoryName}` : ''}`
            : 'No canonical match',
          band: data.band,
          confidence: data.confidence,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId,
          catalogItemId: data.catalogItemId,
        })
        // HIGH band = deterministic match → attach immediately to the
        // matching product row (or the only product row).
        if (data.band === 'HIGH' && data.categoryId) {
          const store = useRfqWizardStore.getState()
          const idx = store.products.findIndex((p) => p.productName === name)
          if (idx >= 0) {
            store.updateProduct(idx, {
              catalogCategoryId: data.categoryId,
              catalogSubcategoryId: data.subcategoryId ?? undefined,
              catalogItemId: data.catalogItemId ?? undefined,
            })
          }
        }
      }
    } catch (err) { console.error('Failed to predict category:', err) }
    setAiGenerating(null)
  }

  const confirmPrediction = () => {
    if (!lastPrediction?.categoryId) return
    const store = useRfqWizardStore.getState()
    const idx = store.products.findIndex((p) => p.productName === lastPrediction.name)
    if (idx >= 0) {
      store.updateProduct(idx, {
        catalogCategoryId: lastPrediction.categoryId,
        catalogSubcategoryId: lastPrediction.subcategoryId ?? undefined,
        catalogItemId: lastPrediction.catalogItemId ?? undefined,
      })
      setLastPrediction(null)
    }
  }

  const handleDetectDuplicates = async () => {
    setAiGenerating('duplicates')
    try {
      const { detectDuplicateRfqs } = await import('@/lib/api/ai-rfq')
      await detectDuplicateRfqs(title, description)
    } catch (err) { console.error('Failed to detect duplicates:', err) }
    setAiGenerating(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Basic Requirements</h2>
        <button onClick={() => setShowAi(!showAi)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20">
          <Sparkles className="h-3 w-3" />
          AI Copilot
          {showAi ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showAi && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <AiRfqCopilot
            onGenerateFromText={handleGenerateFromText}
            onDetectMissing={handleDetectMissing}
            onQualityScore={handleQualityScore}
            onPredictCategory={handlePredictCategory}
            onDetectDuplicates={handleDetectDuplicates}
            rfqData={getRfqData()}
            isGenerating={!!aiGenerating}
          />
        </div>
      )}

      {aiGenerating && (
        <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/5 px-3 py-2 rounded-lg">
          <LoadingSpinner size="xs" />
          AI is generating... {aiGenerating}
        </div>
      )}

      {lastPrediction && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/60">
                Predicted category for <span className="text-white font-medium">{lastPrediction.name}</span>
              </p>
              <p className="mt-1 truncate text-sm text-white">{lastPrediction.label}</p>
              <p className="mt-0.5 text-xs text-white/40">
                Confidence {(lastPrediction.confidence * 100).toFixed(0)}% · Band {lastPrediction.band}
                {lastPrediction.band === 'HIGH' ? ' · applied automatically' : ' · confirm to apply'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastPrediction.categoryId && lastPrediction.band !== 'HIGH' && (
                <Button size="sm" variant="outline" onClick={confirmPrediction}>Confirm</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setLastPrediction(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-white/80">RFQ Title *</Label>
        <Input
          placeholder="e.g. Need 500 units of industrial bearings"
          value={title}
          onChange={(e) => update('title', e.target.value)}
          className="bg-surface border-border text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Description</Label>
        <Textarea
          placeholder="Describe your requirements in detail..."
          value={description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/80">Priority</Label>
          <div className="flex gap-2">
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
              <button
                key={p}
                onClick={() => update('priority', p)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  priority === p ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-surface text-white/60 border border-border hover:border-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Visibility</Label>
          <div className="flex gap-2">
            {['PUBLIC', 'PRIVATE', 'INVITE_ONLY'].map((v) => (
              <button
                key={v}
                onClick={() => update('visibility', v)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  visibility === v ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-surface text-white/60 border border-border hover:border-border'
                }`}
              >
                {v === 'INVITE_ONLY' ? 'Invite Only' : v.charAt(0) + v.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/80">RFQ Type</Label>
          <div className="flex gap-2">
            {['PRODUCT', 'SERVICE', 'BULK'].map((t) => (
              <button
                key={t}
                onClick={() => update('rfqType', t)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  rfqType === t ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-surface text-white/60 border border-border hover:border-border'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Expiry (days)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={expiryDays}
            onChange={(e) => update('expiryDays', parseInt(e.target.value) || 30)}
            className="bg-surface border-border text-white"
          />
        </div>
      </div>
    </div>
  );
}
