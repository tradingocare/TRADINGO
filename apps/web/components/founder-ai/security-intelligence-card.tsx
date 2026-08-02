'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle, Ban, Fingerprint, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { SecurityIntelligenceResponse } from '@/lib/api/ai-founder'

interface Props {
  data?: SecurityIntelligenceResponse
  isLoading: boolean
  error: Error | null
}

const severityColors: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-status-error',
}

const severityBg: Record<string, string> = {
  low: 'bg-emerald-500/10 border-emerald-500/20',
  medium: 'bg-yellow-500/10 border-yellow-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-status-error/10 border-status-error/20',
}

export function SecurityIntelligenceCard({ data, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-text-tertiary/20 animate-pulse" />
            <div className="h-5 w-40 rounded bg-text-tertiary/20 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded bg-text-tertiary/10 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border bg-surface">
        <CardContent className="p-6 text-status-error text-sm">Failed to load security intelligence</CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-border bg-surface">
        <CardContent className="p-6 text-text-tertiary text-sm">No security data available</CardContent>
      </Card>
    )
  }

  const threatColor = severityColors[data.threatLevel] || 'text-text-secondary'

  return (
    <Card className="border-border bg-surface">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-text-primary">Security Intelligence</h3>
          </div>
          <span className={`text-sm font-medium ${threatColor}`}>
            Threat Level: {data.threatLevel.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Security Score</p>
            <p className={`text-2xl font-bold ${data.platformSecurityScore >= 70 ? 'text-emerald-400' : data.platformSecurityScore >= 50 ? 'text-yellow-400' : 'text-status-error'}`}>
              {data.platformSecurityScore}/100
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Open Incidents</p>
            <p className="text-2xl font-bold text-text-primary">{data.incidents.open}</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Failed Logins (24h)</p>
            <p className={`text-2xl font-bold ${data.authentication.failedLogins24h > 10 ? 'text-status-error' : 'text-text-primary'}`}>
              {data.authentication.failedLogins24h}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Prompt Injections</p>
            <p className={`text-2xl font-bold ${data.promptInjection.totalBlocked > 0 ? 'text-orange-400' : 'text-text-primary'}`}>
              {data.promptInjection.totalBlocked}
            </p>
          </div>
        </div>

        {data.topRisks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Top Risks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.topRisks.map((risk, i) => (
                <div key={i} className={`rounded-lg border p-3 ${severityBg[risk.severity] || 'bg-bg-base border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${severityColors[risk.severity] || 'text-text-secondary'}`} />
                      <span className="text-sm font-medium text-text-primary">{risk.title}</span>
                    </div>
                    <span className={`text-xs capitalize ${severityColors[risk.severity] || 'text-text-tertiary'}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-text-primary">{risk.count}</span>
                    <span className={`flex items-center gap-1 text-xs ${risk.trend === 'up' ? 'text-status-error' : risk.trend === 'down' ? 'text-emerald-400' : 'text-text-tertiary'}`}>
                      {risk.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : risk.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                      {risk.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Authentications</p>
            <p className="text-sm font-medium text-text-primary">{data.authentication.failedLogins24h} failures</p>
            <p className="text-[10px] text-text-tertiary">{data.authentication.privilegeChanges24h} privilege changes</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">WebSocket</p>
            <p className="text-sm font-medium text-text-primary">{data.websocketRejections.total} rejections</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Auto-Resolved</p>
            <p className="text-sm font-medium text-text-primary">{data.incidents.autoResolved}</p>
          </div>
          <div className="rounded-lg border border-border bg-bg-base p-3">
            <p className="text-xs text-text-tertiary">Weekly Trend</p>
            <p className={`text-sm font-medium ${data.trends.weeklyChange > 0 ? 'text-status-error' : 'text-emerald-400'}`}>
              {data.trends.weeklyChange > 0 ? '+' : ''}{data.trends.weeklyChange}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
