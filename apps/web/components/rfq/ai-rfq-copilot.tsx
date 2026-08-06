'use client'
import { useState } from 'react'
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb, Star, Search, Globe } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, type Tab } from '@/components/ui/tabs'

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

const rfqTabs: Tab[] = [
  { value: 'generate', label: 'Generate', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: 'analyze', label: 'Analyze', icon: <Search className="h-3.5 w-3.5" /> },
  { value: 'quality', label: 'Quality', icon: <Star className="h-3.5 w-3.5" /> },
  { value: 'category', label: 'Category', icon: <Lightbulb className="h-3.5 w-3.5" /> },
]

export function AiRfqCopilot({ onGenerateFromText, onDetectMissing, onQualityScore, onPredictCategory, onDetectDuplicates, rfqData, isGenerating }: AiRfqCopilotProps) {
  const [naturalText, setNaturalText] = useState('')
  const [language, setLanguage] = useState('en')
  const [activeSection, setActiveSection] = useState<'generate' | 'analyze' | 'quality' | 'category'>('generate')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI RFQ Copilot
      </div>

      <Tabs tabs={rfqTabs} value={activeSection} onChange={v => setActiveSection(v as 'generate' | 'analyze' | 'quality' | 'category')} />

      {activeSection === 'generate' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Describe what you need in natural language:</p>
          <Textarea value={naturalText} onChange={e => setNaturalText(e.target.value)}
            rows={3} placeholder="e.g. I need 500kg food grade cocoa powder every month in Delhi"
            className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent-500 resize-none" />
          <div className="flex gap-2">
            <Select value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
            <button onClick={() => naturalText && onGenerateFromText(naturalText, language === 'en' ? undefined : language)}
              disabled={isGenerating || !naturalText.trim()}
               className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-500 text-black text-xs font-semibold hover:bg-accent-500/80 disabled:opacity-50 transition-colors">
              {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Sparkles className="h-3 w-3" />}
              Generate RFQ
            </button>
          </div>
        </div>
      )}

      {activeSection === 'analyze' && (
        <div className="space-y-2">
          <button onClick={() => onDetectMissing(rfqData)} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-primary hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-accent-500" />}
            Detect Missing Fields
          </button>
          <button onClick={() => rfqData && onDetectDuplicates(String(rfqData.title || ''), String(rfqData.description || ''))} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-primary hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Search className="h-3.5 w-3.5 text-blue-400" />}
            Find Similar RFQs
          </button>
        </div>
      )}

      {activeSection === 'quality' && (
        <div className="space-y-2">
          <button onClick={() => onQualityScore(rfqData)} disabled={isGenerating || !rfqData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-primary hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Star className="h-3.5 w-3.5 text-green-400" />}
            Calculate Quality Score
          </button>
          {rfqData && Object.keys(rfqData).length > 0 && (
            <p className="text-xs text-text-tertiary">Total fields filled: {Object.keys(rfqData).length}</p>
          )}
        </div>
      )}

      {activeSection === 'category' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Enter a product name to predict its category:</p>
          <Input type="text" id="categoryPredictInput" placeholder="e.g. Cocoa Powder"
            className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent-500"
            onKeyDown={e => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) onPredictCategory(val) } }} />
          <button onClick={() => { const input = document.getElementById('categoryPredictInput') as HTMLInputElement; if (input?.value) onPredictCategory(input.value) }}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-text-primary hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Lightbulb className="h-3.5 w-3.5 text-purple-400" />}
            Predict Category
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
        <Globe className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
