'use client'
import { useEffect, useState } from 'react'
import { DashboardPageHeader, StatCard, TableSkeleton } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  getAiInfrastructureDashboard, listProviders, listPrompts, getModelCatalog, getAiCacheStats,
  AiDashboardData, AiProviderConfig, AiPromptTemplate, ModelCapability, CacheStats,
} from '@/lib/api/ai-gateway'
import {
  Activity, DollarSign, CheckCircle, XCircle,
  RefreshCw, BarChart3, Users, Database, Cpu, Eye, FileText, Radio,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AdminAiInfrastructurePage() {
  const [dashboard, setDashboard] = useState<AiDashboardData | null>(null)
  const [providers, setProviders] = useState<{ data: AiProviderConfig[] } | null>(null)
  const [prompts, setPrompts] = useState<{ data: AiPromptTemplate[] } | null>(null)
  const [models, setModels] = useState<{ data: ModelCapability[]; stats: any } | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [activeTab, setActiveTab] = useState<'providers' | 'prompts' | 'usage' | 'models'>('providers')

  useEffect(() => {
    Promise.all([
      getAiInfrastructureDashboard().then(r => setDashboard(r.data)),
      listProviders(1, 50).then(r => setProviders(r.data)),
      listPrompts(1, 50).then(r => setPrompts(r.data)),
      getModelCatalog().then(r => setModels(r.data)),
      getAiCacheStats().then(r => setCacheStats(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const handleCheckAll = async () => {
    setCheckingHealth(true)
    try {
      const { checkAllProvidersHealth, getAiInfrastructureDashboard } = await import('@/lib/api/ai-gateway')
      await checkAllProvidersHealth()
      const res = await getAiInfrastructureDashboard()
      setDashboard(res.data)
    } finally {
      setCheckingHealth(false)
    }
  }

  const healthBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      ACTIVE: { color: 'bg-green-500/15 text-green-400', label: 'Active' },
      DEGRADED: { color: 'bg-amber-500/15 text-amber-400', label: 'Degraded' },
      DOWN: { color: 'bg-red-500/15 text-red-400', label: 'Down' },
      DISABLED: { color: 'bg-surface-secondary text-text-tertiary', label: 'Disabled' },
    }
    const m = map[status] || { color: 'bg-surface text-gray-500', label: status }
    return <Badge className={m.color}>{m.label}</Badge>
  }

  const categoryIcon = (cat: string) => {
    const map: Record<string, typeof Cpu> = { chat: Cpu, search: Radio, scrape: FileText, crawl: Database }
    const Icon = map[cat] || Cpu
    return <Icon className="h-3.5 w-3.5 text-white/40" />
  }

  if (loading) return <div className="space-y-6"><DashboardPageHeader title="AI Infrastructure" description="Manage AI providers, prompts, and monitor usage" /><TableSkeleton rows={8} /></div>

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="AI Infrastructure" description="Manage AI providers, prompts, and monitor usage" />

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard icon={Activity} label="Total Requests" value={String(dashboard.usage.totalRequests)} />
          <StatCard icon={BarChart3} label="Total Tokens" value={String(dashboard.usage.totalTokens)} />
          <StatCard icon={DollarSign} label="Total Cost" value={`$${dashboard.usage.totalCost.toFixed(4)}`} />
          <StatCard icon={Users} label="Today Requests" value={String(dashboard.usage.todayRequests)} />
          <StatCard icon={Database} label="Today Cost" value={`$${dashboard.usage.todayCost.toFixed(4)}`} />
        </div>
      )}

      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 border border-amber-500/20">
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">Cache Hit Rate</p>
            <p className="text-2xl font-bold text-amber-200 mt-1">{cacheStats.hitRate.toFixed(1)}%</p>
            <p className="text-xs text-amber-400 mt-1">{cacheStats.cacheHits} hits / {cacheStats.totalRequests} total</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Active Models</p>
            <p className="text-2xl font-bold text-blue-200 mt-1">{models?.stats?.totalModels || 0}</p>
            <p className="text-xs text-blue-400 mt-1">across {models?.stats?.providers || 0} providers</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 border border-green-500/20">
            <p className="text-xs text-green-400 font-medium uppercase tracking-wide">Online Providers</p>
            <p className="text-2xl font-bold text-green-200 mt-1">{providers?.data?.filter(p => p.healthStatus === 'ACTIVE').length || 0}</p>
            <p className="text-xs text-green-400 mt-1">of {providers?.data?.length || 0} total</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-4 border border-purple-500/20">
            <p className="text-xs text-purple-400 font-medium uppercase tracking-wide">Circuit Open</p>
            <p className="text-2xl font-bold text-purple-200 mt-1">{providers?.data?.filter(p => p.circuitOpen).length || 0}</p>
            <p className="text-xs text-purple-400 mt-1">providers in degraded state</p>
          </div>
        </div>
      )}

      <Tabs tabs={[
        { value: 'providers', label: 'Providers' },
        { value: 'models', label: 'Models' },
        { value: 'prompts', label: 'Prompts' },
        { value: 'usage', label: 'Usage' },
      ]} value={activeTab} onChange={(v) => setActiveTab(v as any)} variant="underline" className="mb-4" />

      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={handleCheckAll} disabled={checkingHealth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
              {checkingHealth ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />} Check All Health
            </button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-tertiary text-xs">
                    <th className="p-3">Provider</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Circuit</th>
                    <th className="p-3">Failures</th>
                    <th className="p-3">Timeout</th>
                    <th className="p-3">Rate Limit</th>
                    <th className="p-3">Last Check</th>
                  </tr>
                </thead>
                <tbody>
                  {(providers?.data || []).map(p => (
                    <tr key={p.name} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-medium">{p.displayName}</td>
                      <td className="p-3 text-text-tertiary">{p.providerType}</td>
                      <td className="p-3">{p.priority}</td>
                      <td className="p-3">{healthBadge(p.healthStatus)}</td>
                      <td className="p-3">{p.circuitOpen ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}</td>
                      <td className="p-3">
                        <span className={p.failureCount > 5 ? 'text-red-400 font-medium' : 'text-text-tertiary'}>{p.failureCount}</span>
                      </td>
                      <td className="p-3 text-text-tertiary">{p.timeoutMs}ms</td>
                      <td className="p-3 text-text-tertiary">{p.rateLimitRpm}/min</td>
                      <td className="p-3 text-text-tertiary text-xs">{p.lastHealthCheckAt ? new Date(p.lastHealthCheckAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-4">
          {models?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(models.stats.byCategory).map(([cat, count]) => (
                <div key={cat} className="rounded-xl bg-surface p-3 text-center border border-border">
                  <p className="text-xs text-text-tertiary uppercase">{cat}</p>
                  <p className="text-lg font-bold text-text-primary">{count as number}</p>
                </div>
              ))}
              {Object.entries(models.stats.byCapability).map(([cap, count]) => (
                <div key={cap} className="rounded-xl bg-surface p-3 text-center border border-border">
                  <p className="text-xs text-text-tertiary uppercase">{cap}</p>
                  <p className="text-lg font-bold text-text-primary">{count as number}</p>
                </div>
              ))}
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-tertiary text-xs">
                    <th className="p-3">Model</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Vision</th>
                    <th className="p-3">OCR</th>
                    <th className="p-3">Streaming</th>
                    <th className="p-3">Max Tokens</th>
                    <th className="p-3">Context</th>
                    <th className="p-3">Cost/1K In</th>
                    <th className="p-3">Cost/1K Out</th>
                  </tr>
                </thead>
                <tbody>
                  {(models?.data || []).map(m => (
                    <tr key={m.name} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-mono text-xs font-medium">{m.name}</td>
                      <td className="p-3 text-text-tertiary">{m.displayName}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1"><span className="flex items-center gap-1">{categoryIcon(m.category)}</span>{m.category}</span>
                      </td>
                      <td className="p-3">{m.vision ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-white/20" />}</td>
                      <td className="p-3">{m.ocr ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-white/20" />}</td>
                      <td className="p-3">{m.streaming ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-white/20" />}</td>
                      <td className="p-3 text-text-tertiary">{m.maxTokens.toLocaleString()}</td>
                      <td className="p-3 text-text-tertiary">{(m.contextWindow / 1000).toFixed(0)}K</td>
                      <td className="p-3 text-text-tertiary">${m.costPer1kInput.toFixed(4)}</td>
                      <td className="p-3 text-text-tertiary">${m.costPer1kOutput.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-tertiary text-xs">
                    <th className="p-3">Task Type</th>
                    <th className="p-3">Version</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Active</th>
                    <th className="p-3">Temperature</th>
                    <th className="p-3">Max Tokens</th>
                    <th className="p-3">Provider Override</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(prompts?.data || []).map(p => (
                    <tr key={p.id} className="border-b border-border hover:bg-surface">
                      <td className="p-3 font-mono text-xs">{p.taskType}</td>
                      <td className="p-3">v{p.version}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3">{p.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-white/20" />}</td>
                      <td className="p-3">{p.temperature}</td>
                      <td className="p-3">{p.maxTokens}</td>
                      <td className="p-3 text-text-tertiary">{p.providerOverride || '-'}</td>
                      <td className="p-3 text-text-tertiary text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Provider Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard?.usage.providerBreakdown.map(p => (
                    <div key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{p.provider}</span>
                      <div className="flex gap-4">
                        <span className="text-text-tertiary">{p.requests} req</span>
                        <span className="text-text-tertiary">{(p.tokens / 1000).toFixed(1)}K tokens</span>
                        <span className="font-medium">${p.cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Top Features</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard?.topFeatures.slice(0, 10).map(f => (
                    <div key={f.taskType} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-text-secondary">{f.taskType}</span>
                      <div className="flex gap-4">
                        <span className="text-text-tertiary">{f.totalRequests} req</span>
                        <span className="font-medium">${f.totalCost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Top Companies</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard?.topCompanies.slice(0, 10).map(c => (
                  <div key={c.companyId} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-mono text-xs">{c.companyId.slice(0, 12)}...</span>
                    <div className="flex gap-4">
                      <span className="text-text-tertiary">{c.totalRequests} req</span>
                      <span className="text-text-tertiary">{(c.totalTokens / 1000).toFixed(1)}K tokens</span>
                      <span className="font-medium">${c.totalCost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
