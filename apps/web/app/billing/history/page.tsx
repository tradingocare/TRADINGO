'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api/client'
import { Loader2, CreditCard, FileText, RotateCcw, ChevronRight, ArrowLeft, CheckCircle, XCircle, Clock, Banknote, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface HistoryEvent {
  id: string
  type: 'payment' | 'invoice' | 'plan_change'
  subtype: string
  label: string
  gateway?: string
  planName?: string
  amount?: number
  date: string
}

const TYPE_CONFIG: Record<string, { icon: any; color: (s: string) => string; link: (e: HistoryEvent) => string | null }> = {
  payment: {
    icon: CreditCard,
    color: (s) => s === 'CAPTURED' || s === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600',
    link: () => '/billing/invoices',
  },
  invoice: {
    icon: FileText,
    color: (s) => s === 'PAID' ? 'bg-green-100 text-green-600' : s === 'VOID' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600',
    link: (e) => `/billing/invoices/${e.id}`,
  },
  plan_change: {
    icon: RefreshCw,
    color: () => 'bg-purple-100 text-purple-600',
    link: () => null,
  },
}

function formatDate(d: string) {
  const dt = new Date(d)
  const isToday = dt.toDateString() === new Date().toDateString()
  return isToday
    ? `Today at ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatAmount(n?: number) {
  if (!n) return ''
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

export default function BillingHistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/billing/history')
      .then(res => {
        const d = res.data?.data || res.data
        setEvents(Array.isArray(d) ? d : d?.events || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/billing/invoices" className="p-2 rounded-lg hover:bg-gray-200 transition-all">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Billing History</h1>
            <p className="text-sm text-gray-500">Payment, invoice, and plan change timeline</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="mt-6 relative">
            <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-0">
              {events.map((evt, i) => {
                const config = TYPE_CONFIG[evt.type] || TYPE_CONFIG.invoice
                const Icon = config.icon
                return (
                  <motion.div key={evt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-4 pb-6 relative ml-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${config.color(evt.subtype)}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {evt.type === 'payment' && `${evt.gateway || 'Payment'} — ${evt.subtype}`}
                          {evt.type === 'invoice' && `Invoice ${evt.label}`}
                          {evt.type === 'plan_change' && `Plan Change: ${evt.subtype}`}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatDate(evt.date)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {evt.type === 'payment' && formatAmount(evt.amount)}
                        {evt.type === 'invoice' && `${evt.planName || ''} ${formatAmount(evt.amount)}`}
                        {evt.type === 'plan_change' && `${evt.label}`}
                      </p>
                    </div>
                    {config.link(evt) && (
                      <Link href={config.link(evt)!}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-all mt-1 shrink-0">
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </motion.div>
                )
              })}
              {events.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">No billing history yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
