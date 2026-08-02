'use client'
import { Shield, AlertTriangle, Truck, CreditCard, Users } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RiskIntelligenceResponse } from '@/lib/api/ai-founder'

interface RiskIntelligenceCardProps {
  data?: RiskIntelligenceResponse
  isLoading: boolean
  error?: Error | null
}

export function RiskIntelligenceCard({ data, isLoading, error }: RiskIntelligenceCardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-tertiary">
        <LoadingSpinner size="sm" color="accent" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm">
        Failed to load risk intelligence
      </div>
    )
  }

  const sections = [
    {
      icon: CreditCard, label: 'Payment Risk', level: data.paymentRisk.riskLevel,
      items: [
        { label: 'Overdue Invoices', value: data.paymentRisk.overdueInvoices.toString() },
        { label: 'Overdue Amount', value: `\u20B9${data.paymentRisk.overdueAmount.toLocaleString()}` },
        { label: 'Critical Accounts', value: data.paymentRisk.criticalAccounts.toString() },
        { label: 'Avg Days Overdue', value: `${data.paymentRisk.avgDaysOverdue}d` },
      ],
    },
    {
      icon: Users, label: 'Churn Risk', level: data.churnRisk.highRiskAccounts > 50 ? 'high' : data.churnRisk.highRiskAccounts > 20 ? 'medium' : 'low',
      items: [
        { label: 'Expiring Subs', value: data.churnRisk.expiringSubscriptions.toString() },
        { label: 'Inactive Sellers', value: `${data.churnRisk.inactiveSellers30d}` },
        { label: 'Inactive Buyers', value: `${data.churnRisk.inactiveBuyers30d}` },
        { label: 'High Risk', value: data.churnRisk.highRiskAccounts.toString() },
      ],
    },
    {
      icon: Shield, label: 'Fraud Risk', level: data.fraudRisk.riskLevel,
      items: [
        { label: 'Open Disputes', value: data.fraudRisk.openDisputes.toString() },
        { label: '24h Alerts', value: data.fraudRisk.fraudAlerts24h.toString() },
        { label: 'Blacklisted', value: data.fraudRisk.blacklistedCompanies.toString() },
      ],
    },
    {
      icon: Truck, label: 'Delivery Risk', level: data.deliveryRisk.deliveryFailureRate > 15 ? 'high' : data.deliveryRisk.deliveryFailureRate > 5 ? 'medium' : 'low',
      items: [
        { label: 'Delayed Shipments', value: data.deliveryRisk.delayedShipments.toString() },
        { label: 'Failure Rate', value: `${data.deliveryRisk.deliveryFailureRate}%` },
        { label: 'Avg Delay', value: `${data.deliveryRisk.avgDelayDays}d` },
      ],
    },
  ]

  const levelColor = (level: string) =>
    level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-accent-500' : 'text-emerald-400'

  return (
    <Card className="p-4 space-y-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Risk Intelligence
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((section, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <section.icon className="h-3 w-3" />
                {section.label}
              </div>
              <span className={`text-[10px] font-medium uppercase ${levelColor(section.level)}`}>{section.level}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map((item, j) => (
                <div key={j}>
                  <div className="text-[10px] text-text-tertiary">{item.label}</div>
                  <div className="text-xs font-medium text-text-primary">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
