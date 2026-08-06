'use client'
import { useState } from 'react'
import { Sparkles, TrendingUp, DollarSign, Target, BarChart3, FileCheck, Handshake, AlertTriangle, Star, Lightbulb } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, type Tab } from '@/components/ui/tabs'

interface PriceRecommendationRequest {
  productName: string; basePrice: number; currency: string; quantity: number; unit: string; deliveryTerms: string
}

interface WinningProbabilityRequest {
  quoteId: string; totalAmount: number; leadTimeDays: number; deliveryTerms: string
}

interface MarginAnalysisRequest {
  subtotal: number; totalAmount: number; taxAmount: number; discountAmount: number; discountPercent: number; currency: string
  lineItems: Array<{ productName: string; quantity: number; unitPrice: number }>
}

interface CompetitivenessRequest {
  totalAmount: number; leadTimeDays: number; deliveryTerms: string; paymentTerms: string
}

interface ReviewRequest {
  quoteId: string; quoteData: Record<string, unknown> & { lineItems: Record<string, unknown>[] }; strictness: boolean
}

interface AiQuoteSidebarProps {
  companyId: string
  formData: Record<string, unknown>
  lineItems: Record<string, unknown>[]
  rfqData?: Record<string, unknown>
  onPriceRecommendation: (data: PriceRecommendationRequest) => Promise<unknown>
  onWinningProbability: (data: WinningProbabilityRequest) => Promise<unknown>
  onMarginAnalysis: (data: MarginAnalysisRequest) => Promise<unknown>
  onCompetitiveness: (data: CompetitivenessRequest) => Promise<unknown>
  onReview: (data: ReviewRequest) => Promise<unknown>
  onNegotiationPrep: (data: { quoteData: Record<string, unknown> & { lineItems: Record<string, unknown>[] } }) => Promise<unknown>
  onRiskAssessment: (data: { quoteAmount: number }) => Promise<unknown>
  onQualityScore: (data: { quoteData: Record<string, unknown> & { lineItems: Record<string, unknown>[] } }) => Promise<unknown>
  isGenerating: boolean
}

type AdvisorTab = 'pricing' | 'analysis' | 'strategy' | 'quality'

const tabs: Tab[] = [
  { value: 'pricing', label: 'Pricing', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'analysis', label: 'Analysis', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { value: 'strategy', label: 'Strategy', icon: <Handshake className="h-3.5 w-3.5" /> },
  { value: 'quality', label: 'Quality', icon: <Star className="h-3.5 w-3.5" /> },
]

export function AiQuoteSidebar({
  companyId, formData, lineItems, rfqData,
  onPriceRecommendation, onWinningProbability, onMarginAnalysis,
  onCompetitiveness, onReview, onNegotiationPrep,
  onRiskAssessment, onQualityScore, isGenerating,
}: AiQuoteSidebarProps) {
  const [activeTab, setActiveTab] = useState<AdvisorTab>('pricing')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI Quote Advisor
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={v => setActiveTab(v as AdvisorTab)} />

      {activeTab === 'pricing' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">AI-powered pricing insights for your quote.</p>
          <button onClick={() => onPriceRecommendation({ productName: String((lineItems[0] as any)?.productName || ''), basePrice: parseFloat(String((lineItems[0] as any)?.unitPrice || '0')), currency: String((formData as any)?.currency || 'INR'), quantity: parseInt(String((lineItems[0] as any)?.quantity || '1')), unit: String((lineItems[0] as any)?.unit || 'pcs'), deliveryTerms: String((formData as any)?.deliveryTerms || '') })}
            disabled={isGenerating || !lineItems.length}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <TrendingUp className="h-3.5 w-3.5 text-accent-500" />}
            Price Recommendation
          </button>
          <button onClick={() => onWinningProbability({ quoteId: '', totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), leadTimeDays: parseInt(String((formData as any)?.leadTimeDays || '0')), deliveryTerms: String((formData as any)?.deliveryTerms || '') })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Win Probability
          </button>
          <button onClick={() => onCompetitiveness({ totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), leadTimeDays: parseInt(String((formData as any)?.leadTimeDays || '0')), deliveryTerms: String((formData as any)?.deliveryTerms || ''), paymentTerms: String((formData as any)?.paymentTerms || '') })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-blue-400" />}
            Competitiveness Score
          </button>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Deep-dive analysis on margins and risks.</p>
          <button onClick={() => onMarginAnalysis({ subtotal: parseFloat(String((formData as any)?.subtotal || '0')), totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), taxAmount: parseFloat(String((formData as any)?.taxAmount || '0')), discountAmount: parseFloat(String((formData as any)?.discountAmount || '0')), discountPercent: parseFloat(String((formData as any)?.discountPercent || '0')), currency: String((formData as any)?.currency || 'INR'), lineItems: lineItems.map(li => ({ productName: String((li as any)?.productName || ''), quantity: parseInt(String((li as any)?.quantity || '1')), unitPrice: parseFloat(String((li as any)?.unitPrice || '0')) })) })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <DollarSign className="h-3.5 w-3.5 text-purple-400" />}
            Margin Analysis
          </button>
          <button onClick={() => onRiskAssessment({ quoteAmount: parseFloat(String((formData as any)?.totalAmount || '0')) })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Risk Assessment
          </button>
          <button onClick={() => onReview({ quoteId: '', quoteData: { ...formData, lineItems }, strictness: true })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <FileCheck className="h-3.5 w-3.5 text-accent-500" />}
            Quote Review
          </button>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Negotiation strategies and buyer insights.</p>
          <button onClick={() => onNegotiationPrep({ quoteData: { ...formData, lineItems } })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Handshake className="h-3.5 w-3.5 text-cyan-400" />}
            Negotiation Prep
          </button>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Score and improve your quote quality.</p>
          <button onClick={() => onQualityScore({ quoteData: { ...formData, lineItems } })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Star className="h-3.5 w-3.5 text-green-400" />}
            Quality Score
          </button>
          {lineItems.length > 0 && (
            <p className="text-xs text-text-tertiary">Line items: {lineItems.length}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-tertiary pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
