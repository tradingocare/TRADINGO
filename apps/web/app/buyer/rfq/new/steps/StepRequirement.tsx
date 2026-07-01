'use client';

import { useState } from 'react'
import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AiRfqCopilot } from '@/components/rfq/ai-rfq-copilot'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

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
    } catch {}
    setAiGenerating(null)
  }

  const handleDetectMissing = async () => {
    setAiGenerating('missing')
    try {
      const { detectMissingFields } = await import('@/lib/api/ai-rfq')
      await detectMissingFields(getRfqData())
    } catch {}
    setAiGenerating(null)
  }

  const handleQualityScore = async () => {
    setAiGenerating('quality')
    try {
      const { calculateQualityScore } = await import('@/lib/api/ai-rfq')
      await calculateQualityScore(getRfqData())
    } catch {}
    setAiGenerating(null)
  }

  const handlePredictCategory = async (name: string) => {
    setAiGenerating('category')
    try {
      const { predictCategory } = await import('@/lib/api/ai-rfq')
      await predictCategory(name)
    } catch {}
    setAiGenerating(null)
  }

  const handleDetectDuplicates = async () => {
    setAiGenerating('duplicates')
    try {
      const { detectDuplicateRfqs } = await import('@/lib/api/ai-rfq')
      await detectDuplicateRfqs(title, description)
    } catch {}
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
          <Loader2 className="h-3 w-3 animate-spin" />
          AI is generating... {aiGenerating}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-white/80">RFQ Title *</Label>
        <Input
          placeholder="e.g. Need 500 units of industrial bearings"
          value={title}
          onChange={(e) => update('title', e.target.value)}
          className="bg-white/[0.04] border-white/[0.06] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Description</Label>
        <textarea
          placeholder="Describe your requirements in detail..."
          value={description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
                  priority === p ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:border-white/20'
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
                  visibility === v ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:border-white/20'
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
                  rfqType === t ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:border-white/20'
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
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
      </div>
    </div>
  );
}
