'use client'
import { useState } from 'react'
import { Sparkles, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb, DollarSign, Shield, CreditCard, Receipt, AlertOctagon, FileEdit } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Tabs, type Tab } from '@/components/ui/tabs'

interface CollectionDraftRequest {
  customerName: string; outstandingAmount: number; daysOverdue: number
}

interface AiFinanceCopilotProps {
  isGenerating: boolean
  onCreditRisk: (data: Record<string, unknown>) => Promise<unknown>
  onPaymentDelay: (data: Record<string, unknown>) => Promise<unknown>
  onCashFlowForecast: (data: Record<string, unknown>) => Promise<unknown>
  onCollectionStrategy: (data: Record<string, unknown>) => Promise<unknown>
  onFinancialHealth: (data: Record<string, unknown>) => Promise<unknown>
  onCreditLimit: (data: Record<string, unknown>) => Promise<unknown>
  onInvoiceIntelligence: (data: Record<string, unknown>) => Promise<unknown>
  onFraudSignals: (data: Record<string, unknown>) => Promise<unknown>
  onCollectionDraft: (data: CollectionDraftRequest) => Promise<unknown>
  contextData?: Record<string, unknown>
}

type CopilotTab = 'credit' | 'cashflow' | 'collections' | 'risk'

const tabs: Tab[] = [
  { value: 'credit', label: 'Credit', icon: <CreditCard className="h-3.5 w-3.5" /> },
  { value: 'cashflow', label: 'Cash Flow', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'collections', label: 'Collect.', icon: <Shield className="h-3.5 w-3.5" /> },
  { value: 'risk', label: 'Risk', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
]

export function AiFinanceCopilot({
  isGenerating, contextData = {},
  onCreditRisk, onPaymentDelay, onCashFlowForecast,
  onCollectionStrategy, onFinancialHealth, onCreditLimit,
  onInvoiceIntelligence, onFraudSignals, onCollectionDraft,
}: AiFinanceCopilotProps) {
  const [activeTab, setActiveTab] = useState<CopilotTab>('credit')
  const [customerName, setCustomerName] = useState('')
  const [outstandingAmount, setOutstandingAmount] = useState('')
  const [daysOverdue, setDaysOverdue] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-accent-500" />
        AI Finance Copilot
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={v => setActiveTab(v as CopilotTab)} />

      {activeTab === 'credit' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Credit risk, limit recommendations, and financial health.</p>
          <button onClick={() => onCreditRisk(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Shield className="h-3.5 w-3.5 text-accent-500" />}
            Credit Risk Assessment
          </button>
          <button onClick={() => onCreditLimit(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <TrendingUp className="h-3.5 w-3.5 text-green-400" />}
            Credit Limit Recommendation
          </button>
          <button onClick={() => onFinancialHealth(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <BarChart3 className="h-3.5 w-3.5 text-blue-400" />}
            Financial Health Assessment
          </button>
          <button onClick={() => onPaymentDelay(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent-500/10 hover:border-accent-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Target className="h-3.5 w-3.5 text-accent-500" />}
            Payment Delay Prediction
          </button>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Cash flow forecasting and invoice analysis.</p>
          <button onClick={() => onCashFlowForecast(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <DollarSign className="h-3.5 w-3.5 text-purple-400" />}
            Cash Flow Forecast
          </button>
          <button onClick={() => onInvoiceIntelligence(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <Receipt className="h-3.5 w-3.5 text-cyan-400" />}
            Invoice Intelligence
          </button>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Collection strategies and draft generation.</p>
          <button onClick={() => onCollectionStrategy(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            Collection Strategy
          </button>
          <div className="space-y-1.5 pt-1">
            <Input placeholder="Customer name" className="text-xs h-7" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            <div className="flex gap-1.5">
              <Input placeholder="Amount" className="text-xs h-7 w-1/2" value={outstandingAmount} onChange={e => setOutstandingAmount(e.target.value)} />
              <Input placeholder="Days overdue" className="text-xs h-7 w-1/2" value={daysOverdue} onChange={e => setDaysOverdue(e.target.value)} />
            </div>
            <button onClick={() => onCollectionDraft({ customerName, outstandingAmount: Number(outstandingAmount) || 0, daysOverdue: Number(daysOverdue) || 0 })}
              disabled={isGenerating || !customerName}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
              {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <FileEdit className="h-3.5 w-3.5 text-indigo-400" />}
              Generate Collection Draft
            </button>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">Fraud detection and risk signals.</p>
          <button onClick={() => onFraudSignals(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <LoadingSpinner size="xs" color="accent" /> : <AlertOctagon className="h-3.5 w-3.5 text-red-400" />}
            Fraud Signal Detection
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-text-tertiary pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway (FINANCE_ANALYSIS)
      </div>
    </div>
  )
}


