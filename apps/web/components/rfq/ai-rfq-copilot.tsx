'use client'
import { useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Lightbulb, Star, Search, Globe } from 'lucide-react'

interface AiRfqCopilotProps {
  onGenerateFromText: (text: string, language?: string) => Promise<any>
  onDetectMissing: (data: Record<string, unknown>) => Promise<any>
  onQualityScore: (data: Record<string, unknown>) => Promise<any>
  onPredictCategory: (name: string) => Promise<any>
  onDetectDuplicates: (title: string, description?: string) => Promise<any>
  rfqData: Record<string, unknown>
  isGenerating: boolean
}

const LANGUAGES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
]

export function AiRfqCopilot({ onGenerateFromText, onDetectMissing, onQualityScore, onPredictCategory, onDetectDuplicates, rfqData, isGenerating }: AiRfqCopilotProps) {
  const [naturalText, setNaturalText] = useState('')
  const [language, setLanguage] = useState('en')
  const [activeSection, setActiveSection] = useState<'generate' | 'analyze' | 'quality' | 'category'>('generate')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Sparkles className="h-4 w-4 text-orange-500" />
        AI RFQ Copilot
      </div>

      <div className="flex gap-1 border-b border-gray-100 text-xs">
        {(['generate', 'analyze', 'quality', 'category'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-2 py-1.5 border-b-2 capitalize transition-colors ${activeSection === s ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {s === 'generate' && <Sparkles className="h-3 w-3 inline mr-1" />}
            {s === 'analyze' && <Search className="h-3 w-3 inline mr-1" />}
            {s === 'quality' && <Star className="h-3 w-3 inline mr-1" />}
            {s === 'category' && <Lightbulb className="h-3 w-3 inline mr-1" />}
            {s}
          </button>
        ))}
      </div>

      {activeSection === 'generate' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Describe what you need in natural language:</p>
          <textarea value={naturalText} onChange={e => setNaturalText(e.target.value)}
            rows={3} placeholder="e.g. I need 500kg food grade cocoa powder every month in Delhi"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none" />
          <div className="flex gap-2">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-orange-400">
              <option value="en">English</option>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button onClick={() => naturalText && onGenerateFromText(naturalText, language === 'en' ? undefined : language)}
              disabled={isGenerating || !naturalText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Generate RFQ
            </button>
          </div>
        </div>
      )}

      {activeSection === 'analyze' && (
        <div className="space-y-2">
          <button onClick={() => onDetectMissing(rfqData)} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            Detect Missing Fields
          </button>
          <button onClick={() => rfqData && onDetectDuplicates(String(rfqData.title || ''), String(rfqData.description || ''))} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5 text-blue-500" />}
            Find Similar RFQs
          </button>
        </div>
      )}

      {activeSection === 'quality' && (
        <div className="space-y-2">
          <button onClick={() => onQualityScore(rfqData)} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-green-50 hover:border-green-300 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5 text-green-500" />}
            Calculate Quality Score
          </button>
          {rfqData && Object.keys(rfqData).length > 0 && (
            <p className="text-xs text-gray-400">Total fields filled: {Object.keys(rfqData).length}</p>
          )}
        </div>
      )}

      {activeSection === 'category' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Enter a product name to predict its category:</p>
          <input type="text" id="categoryPredictInput" placeholder="e.g. Cocoa Powder"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
            onKeyDown={e => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) onPredictCategory(val) } }} />
          <button onClick={() => { const input = document.getElementById('categoryPredictInput') as HTMLInputElement; if (input?.value) onPredictCategory(input.value) }}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5 text-purple-500" />}
            Predict Category
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <Globe className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
