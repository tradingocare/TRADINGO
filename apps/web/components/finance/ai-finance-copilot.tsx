'use client'
import { useState } from 'react'
import { Sparkles, Loader2, TrendingUp, Target, AlertTriangle, MessageSquare, FileText, BarChart3, Lightbulb, DollarSign, Shield, CreditCard, Receipt, AlertOctagon, FileEdit } from 'lucide-react'

interface AiFinanceCopilotProps {
  isGenerating: boolean
  onCreditRisk: (data: any) => Promise<any>
  onPaymentDelay: (data: any) => Promise<any>
  onCashFlowForecast: (data: any) => Promise<any>
  onCollectionStrategy: (data: any) => Promise<any>
  onFinancialHealth: (data: any) => Promise<any>
  onCreditLimit: (data: any) => Promise<any>
  onInvoiceIntelligence: (data: any) => Promise<any>
  onFraudSignals: (data: any) => Promise<any>
  onCollectionDraft: (data: any) => Promise<any>
  contextData?: Record<string, unknown>
}

type CopilotTab = 'credit' | 'cashflow' | 'collections' | 'risk'

const TABS: { key: CopilotTab; label: string; icon: typeof TrendingUp }[] = [
  { key: 'credit', label: 'Credit', icon: CreditCard },
  { key: 'cashflow', label: 'Cash Flow', icon: DollarSign },
  { key: 'collections', label: 'Collect.', icon: Shield },
  { key: 'risk', label: 'Risk', icon: AlertTriangle },
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
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-orange-400" />
        AI Finance Copilot
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] text-xs overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-2 py-1.5 border-b-2 whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-orange-400 text-orange-300' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Icon className="h-3 w-3" />
              {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'credit' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Credit risk, limit recommendations, and financial health.</p>
          <button onClick={() => onCreditRisk(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-orange-500/10 hover:border-orange-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5 text-orange-400" />}
            Credit Risk Assessment
          </button>
          <button onClick={() => onCreditLimit(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-green-500/10 hover:border-green-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5 text-green-400" />}
            Credit Limit Recommendation
          </button>
          <button onClick={() => onFinancialHealth(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-blue-500/10 hover:border-blue-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5 text-blue-400" />}
            Financial Health Assessment
          </button>
          <button onClick={() => onPaymentDelay(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-amber-500/10 hover:border-amber-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5 text-amber-400" />}
            Payment Delay Prediction
          </button>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Cash flow forecasting and invoice analysis.</p>
          <button onClick={() => onCashFlowForecast(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-purple-500/10 hover:border-purple-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5 text-purple-400" />}
            Cash Flow Forecast
          </button>
          <button onClick={() => onInvoiceIntelligence(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-cyan-500/10 hover:border-cyan-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5 text-cyan-400" />}
            Invoice Intelligence
          </button>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Collection strategies and draft generation.</p>
          <button onClick={() => onCollectionStrategy(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
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
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 disabled:opacity-50 transition-colors">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileEdit className="h-3.5 w-3.5 text-indigo-400" />}
              Generate Collection Draft
            </button>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">Fraud detection and risk signals.</p>
          <button onClick={() => onFraudSignals(contextData)}
            disabled={isGenerating}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-sm hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50 transition-colors">
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertOctagon className="h-3.5 w-3.5 text-red-400" />}
            Fraud Signal Detection
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-white/30 pt-2">
        <Lightbulb className="h-3 w-3" />
        Powered by AI Gateway (FINANCE_ANALYSIS)
      </div>
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return <input className={`w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 ${className}`} {...props} />
}
