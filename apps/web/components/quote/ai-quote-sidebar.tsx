'use client'
import { useState } from 'react'
import { Sparkles, Loader2, TrendingUp, DollarSign, Target, BarChart3, FileCheck, Handshake, AlertTriangle, Star, Lightbulb } from 'lucide-react'

interface AiQuoteSidebarProps {
  companyId: string
  formData: Record<string, unknown>
  lineItems: Record<string, unknown>[]
  rfqData?: Record<string, unknown>
  onPriceRecommendation: (data: any) => Promise<any>
  onWinningProbability: (data: any) => Promise<any>
  onMarginAnalysis: (data: any) => Promise<any>
  onCompetitiveness: (data: any) => Promise<any>
  onReview: (data: any) => Promise<any>
  onNegotiationPrep: (data: any) => Promise<any>
  onRiskAssessment: (data: any) => Promise<any>
  onQualityScore: (data: any) => Promise<any>
  isGenerating: boolean
}

type AdvisorTab = 'pricing' | 'analysis' | 'strategy' | 'quality'

const TABS: { key: AdvisorTab; label: string; icon: typeof DollarSign }[] = [
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'analysis', label: 'Analysis', icon: BarChart3 },
  { key: 'strategy', label: 'Strategy', icon: Handshake },
  { key: 'quality', label: 'Quality', icon: Star },
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
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI Quote Advisor
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] text-xs">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-2 py-1.5 border-b-2 transition-colors ${activeTab === t.key ? 'border-orange-400 text-orange-300' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'pricing' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">AI-powered pricing insights for your quote.</p>
          <button onClick={() => onPriceRecommendation({ productName: String((lineItems[0] as any)?.productName || ''), basePrice: parseFloat(String((lineItems[0] as any)?.unitPrice || '0')), currency: String((formData as any)?.currency || 'INR'), quantity: parseInt(String((lineItems[0] as any)?.quantity || '1')), unit: String((lineItems[0] as any)?.unit || 'pcs'), deliveryTerms: String((formData as any)?.deliveryTerms || '') })}
            disabled={isGenerating || !lineItems.length}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-orange-500/10 hover:border-orange-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5 text-orange-400" />}
            Price Recommendation
          </button>
          <button onClick={() => onWinningProbability({ quoteId: '', totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), leadTimeDays: parseInt(String((formData as any)?.leadTimeDays || '0')), deliveryTerms: String((formData as any)?.deliveryTerms || '') })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5 text-green-400" />}
            Win Probability
          </button>
          <button onClick={() => onCompetitiveness({ totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), leadTimeDays: parseInt(String((formData as any)?.leadTimeDays || '0')), deliveryTerms: String((formData as any)?.deliveryTerms || ''), paymentTerms: String((formData as any)?.paymentTerms || '') })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-blue-400" />}
            Competitiveness Score
          </button>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Deep-dive analysis on margins and risks.</p>
          <button onClick={() => onMarginAnalysis({ subtotal: parseFloat(String((formData as any)?.subtotal || '0')), totalAmount: parseFloat(String((formData as any)?.totalAmount || '0')), taxAmount: parseFloat(String((formData as any)?.taxAmount || '0')), discountAmount: parseFloat(String((formData as any)?.discountAmount || '0')), discountPercent: parseFloat(String((formData as any)?.discountPercent || '0')), currency: String((formData as any)?.currency || 'INR'), lineItems: lineItems.map(li => ({ productName: String((li as any)?.productName || ''), quantity: parseInt(String((li as any)?.quantity || '1')), unitPrice: parseFloat(String((li as any)?.unitPrice || '0')) })) })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5 text-purple-400" />}
            Margin Analysis
          </button>
          <button onClick={() => onRiskAssessment({ quoteAmount: parseFloat(String((formData as any)?.totalAmount || '0')) })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Risk Assessment
          </button>
          <button onClick={() => onReview({ quoteId: '', quoteData: { ...formData, lineItems }, strictness: true })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5 text-amber-400" />}
            Quote Review
          </button>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Negotiation strategies and buyer insights.</p>
          <button onClick={() => onNegotiationPrep({ quoteData: { ...formData, lineItems } })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Handshake className="h-3.5 w-3.5 text-cyan-400" />}
            Negotiation Prep
          </button>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Score and improve your quote quality.</p>
          <button onClick={() => onQualityScore({ quoteData: { ...formData, lineItems } })}
            disabled={isGenerating || !formData}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5 text-green-400" />}
            Quality Score
          </button>
          {lineItems.length > 0 && (
            <p className="text-xs text-white/30">Line items: {lineItems.length}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-white/30 pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway
      </div>
    </div>
  )
}
