'use client'

import { useState, useMemo } from 'react'
import {
  Cpu, Search, Filter, Play, RotateCcw, Trash2, CheckCircle2, XCircle,
  Clock, Database, BarChart3, Activity, RefreshCw, ChevronDown, ChevronRight,
  Braces, Workflow, Sparkles, Layers, AlertTriangle,
} from 'lucide-react'
import { useAiOrchestrate, useAiWorkflowExecute, useAiListActions, useAiGetAction, useAiGetContext, useAiMemoryStats, useAiObservabilityStats, useAiClearCache } from '@/hooks/use-ai-orchestrator'
import type { AiActionInfo, WorkflowDefinition, WorkflowStepResult, ObservabilityEvent } from '@/lib/api/ai-orchestrator'

const MODULES = ['ai', 'smart-rfq', 'quote', 'smart-negotiation', 'finance', 'tradfind', 'admin-intelligence', 'tradetalk', 'founder-ai']
const ALL_TAGS = ['product', 'content', 'seo', 'translation', 'specs', 'images', 'attributes', 'category', 'compliance', 'recommendations', 'commerce', 'analytics', 'pricing', 'advertising', 'rfq', 'generation', 'optimization', 'completeness', 'duplicates', 'matching', 'quality', 'assistant', 'quote', 'finance', 'negotiation', 'strategy', 'suggestions', 'communication', 'risk', 'memory', 'summary', 'search', 'semantic', 'ranking', 'filters', 'admin', 'executive', 'fraud', 'alerts', 'reports', 'tradetalk', 'community', 'networking', 'content', 'dashboard', 'notifications', 'founder', 'health', 'priorities', 'timeline', 'marketplace', 'tradeserv', 'membership', 'gocash', 'tradtrust']

const WORKFLOWS: WorkflowDefinition[] = [
  { id: 'product-launch-optimization', name: 'Product Launch Optimization', description: '7-step optimization: description, SEO, specs, images, pricing, title, highlights', tags: ['product', 'launch'], steps: [] },
  { id: 'seller-growth-review', name: 'Seller Growth Review', description: '5-step seller analysis: sales potential, demand, competition, ads, full insights', tags: ['seller', 'growth'], steps: [] },
  { id: 'marketplace-health-review', name: 'Marketplace Health Review', description: '5-step marketplace health: brief, revenue, growth, fraud, churn', tags: ['marketplace', 'health'], steps: [] },
  { id: 'founder-executive-brief', name: 'Founder Executive Brief', description: '6-step executive brief: brief, dashboard, risk, growth, health, priorities', tags: ['founder', 'executive'], steps: [] },
]

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <Icon className="h-5 w-5 text-accent" />
        <span className="flex-1 text-sm font-bold text-text-primary">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-text-tertiary" /> : <ChevronRight className="h-4 w-4 text-text-tertiary" />}
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-tertiary">{label}</p>
          {sub && <p className="text-[10px] text-text-tertiary">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function AiOrchestratorPage() {
  const [activeTab, setActiveTab] = useState<'browser' | 'dispatch' | 'workflow' | 'monitor'>('browser')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Cpu size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-black text-text-primary">AI Orchestrator Console</h1>
          <p className="text-xs text-text-tertiary">Enterprise AI action dispatch, workflows, and observability</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface-secondary p-1">
        {[
          { id: 'browser', label: 'Action Browser', icon: Search },
          { id: 'dispatch', label: 'Dispatch', icon: Play },
          { id: 'workflow', label: 'Workflows', icon: Workflow },
          { id: 'monitor', label: 'Monitor', icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-accent text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'browser' && <ActionBrowser />}
      {activeTab === 'dispatch' && <DispatchPanel />}
      {activeTab === 'workflow' && <WorkflowPanel />}
      {activeTab === 'monitor' && <MonitorPanel />}
    </div>
  )
}

function ActionBrowser() {
  const { data, isLoading, error } = useAiListActions()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const filtered = useMemo(() => {
    const actions = data?.data?.actions ?? []
    return actions.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.id.toLowerCase().includes(search.toLowerCase())) return false
      if (moduleFilter && a.module !== moduleFilter) return false
      if (tagFilter && !a.tags.includes(tagFilter)) return false
      if (roleFilter && !a.requiredRole.includes(roleFilter)) return false
      return true
    })
  }, [data, search, moduleFilter, tagFilter, roleFilter])

  const modules = useMemo(() => {
    const actions = data?.data?.actions ?? []
    return [...new Set(actions.map(a => a.module))].sort()
  }, [data])

  const roles = useMemo(() => {
    const actions = data?.data?.actions ?? []
    return [...new Set(actions.flatMap(a => a.requiredRole))].sort()
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions by name or ID..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Tags</option>
          {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50">
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {isLoading && <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-text-tertiary" /></div>}
      {error && <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 text-sm text-status-error">Failed to load actions</div>}
      {!isLoading && !error && filtered.length === 0 && <div className="py-12 text-center text-sm text-text-tertiary">No actions match your filters</div>}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Module</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(action => (
                <tr key={action.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{action.name}</p>
                    <p className="text-[11px] text-text-tertiary">{action.id}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{action.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] text-accent">{action.module}</span>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{action.credits > 0 ? action.credits : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {action.requiredRole.map(r => (
                        <span key={r} className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] text-text-secondary">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {action.tags.map(t => (
                        <span key={t} className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] text-text-tertiary">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DispatchPanel() {
  const { data: actionsData } = useAiListActions()
  const dispatch = useAiOrchestrate()
  const [selectedActionId, setSelectedActionId] = useState('')
  const [payloadText, setPayloadText] = useState('{\n  \n}')
  const [result, setResult] = useState<any>(null)

  const actions = actionsData?.data?.actions ?? []

  const handleDispatch = async () => {
    if (!selectedActionId) return
    setResult(null)
    try {
      let payload: Record<string, any> = {}
      try { payload = JSON.parse(payloadText) } catch { payload = { text: payloadText } }
      const res = await dispatch.mutateAsync({ actionId: selectedActionId, companyId: 'system', payload })
      setResult(res.data)
    } catch (err: any) {
      setResult({ success: false, error: err.message, response: err.response?.data })
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-sm font-bold text-text-primary">Single Action Dispatch</h3>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Action</label>
          <select value={selectedActionId} onChange={e => setSelectedActionId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="">Select an action...</option>
            {actions.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Payload (JSON)</label>
          <textarea value={payloadText} onChange={e => setPayloadText(e.target.value)} rows={6}
            className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>

        <button onClick={handleDispatch} disabled={!selectedActionId || dispatch.isPending}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent/90 disabled:opacity-50">
          {dispatch.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {dispatch.isPending ? 'Dispatching...' : 'Dispatch'}
        </button>
      </div>

      {result && (
        <div className={`rounded-2xl border p-4 space-y-2 ${result.success ? 'border-status-success/20 bg-status-success/5' : 'border-status-error/20 bg-status-error/5'}`}>
          <div className="flex items-center gap-2">
            {result.success ? <CheckCircle2 className="h-5 w-5 text-status-success" /> : <XCircle className="h-5 w-5 text-status-error" />}
            <span className={`text-sm font-bold ${result.success ? 'text-status-success' : 'text-status-error'}`}>
              {result.success ? 'Success' : 'Failed'}
            </span>
            {result.latencyMs && <span className="text-xs text-text-tertiary ml-auto">{formatLatency(result.latencyMs)}</span>}
          </div>
          {result.credits && (
            <p className="text-xs text-text-tertiary">Credits: {result.credits.required} used, {result.credits.remaining} remaining</p>
          )}
          <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-bg-base p-3 text-xs font-mono text-text-primary">
            {JSON.stringify(result.result ?? result.error ?? result.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function WorkflowPanel() {
  const workflowExec = useAiWorkflowExecute()
  const [selectedWf, setSelectedWf] = useState('')
  const [contextText, setContextText] = useState('{\n  \n}')
  const [wfResult, setWfResult] = useState<any>(null)

  const handleExecute = async () => {
    if (!selectedWf) return
    setWfResult(null)
    try {
      let context: Record<string, any> = {}
      try { context = JSON.parse(contextText) } catch { context = { text: contextText } }
      const res = await workflowExec.mutateAsync({ workflowId: selectedWf, companyId: 'system', context })
      setWfResult(res.data)
    } catch (err: any) {
      setWfResult({ success: false, error: err.message, response: err.response?.data })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {WORKFLOWS.map(wf => (
          <button key={wf.id} onClick={() => setSelectedWf(wf.id)}
            className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selectedWf === wf.id ? 'border-accent bg-accent/5' : 'border-border bg-surface'}`}>
            <h3 className="text-sm font-bold text-text-primary">{wf.name}</h3>
            <p className="mt-1 text-xs text-text-tertiary">{wf.description}</p>
            <div className="mt-2 flex gap-1.5">
              {wf.tags.map(t => <span key={t} className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] text-text-tertiary">{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <h3 className="text-sm font-bold text-text-primary">Execute Workflow</h3>
        <p className="text-xs text-text-tertiary">
          {selectedWf ? `Selected: ${WORKFLOWS.find(w => w.id === selectedWf)?.name ?? selectedWf}` : 'Select a workflow above'}
        </p>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Context (JSON)</label>
          <textarea value={contextText} onChange={e => setContextText(e.target.value)} rows={4}
            className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>

        <button onClick={handleExecute} disabled={!selectedWf || workflowExec.isPending}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-primary hover:bg-accent/90 disabled:opacity-50">
          {workflowExec.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {workflowExec.isPending ? 'Executing...' : 'Execute Workflow'}
        </button>
      </div>

      {wfResult && (
        <div className={`rounded-2xl border p-4 space-y-3 ${wfResult.success ? 'border-status-success/20 bg-status-success/5' : 'border-status-error/20 bg-status-error/5'}`}>
          <div className="flex items-center gap-2">
            {wfResult.success ? <CheckCircle2 className="h-5 w-5 text-status-success" /> : <XCircle className="h-5 w-5 text-status-error" />}
            <span className={`text-sm font-bold ${wfResult.success ? 'text-status-success' : 'text-status-error'}`}>
              {wfResult.success ? 'Completed' : 'Failed'} — {wfResult.stepsCompleted ?? 0}/{wfResult.totalSteps ?? 0} steps
            </span>
            {wfResult.totalLatencyMs && <span className="text-xs text-text-tertiary ml-auto">{formatLatency(wfResult.totalLatencyMs)}</span>}
          </div>

          {wfResult.results?.map((step: WorkflowStepResult, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-surface-secondary p-3 space-y-1">
              <div className="flex items-center gap-2">
                {step.success ? <CheckCircle2 className="h-4 w-4 text-status-success" /> : <XCircle className="h-4 w-4 text-status-error" />}
                <span className="text-xs font-medium text-text-primary">Step {step.step}: {step.actionId}</span>
                <span className="text-[10px] text-text-tertiary ml-auto">{formatLatency(step.latencyMs)}</span>
              </div>
              {step.error && <p className="text-xs text-status-error">{step.error}</p>}
              {step.result && (
                <pre className="max-h-32 overflow-auto rounded-lg bg-bg-base p-2 text-[10px] font-mono text-text-primary">
                  {JSON.stringify(step.result, null, 2).slice(0, 500)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MonitorPanel() {
  const memory = useAiMemoryStats()
  const observability = useAiObservabilityStats()
  const clearCache = useAiClearCache()
  const [clearing, setClearing] = useState(false)

  const memData = memory.data?.data
  const obsData = observability.data?.data
  const breakdown = obsData?.stats?.actionBreakdown ?? {}
  const recent = obsData?.recent ?? []

  const handleClearCache = async () => {
    setClearing(true)
    try { await clearCache.mutateAsync() } catch {}
    setTimeout(() => setClearing(false), 1500)
  }

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Memory Cache" icon={Database}>
        {memory.isLoading && <div className="py-4 text-center text-sm text-text-tertiary"><RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" />Loading...</div>}
        {memData && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Database} label="Cache Entries" value={String(memData.size)} sub={`Max: ${memData.maxSize}`} />
            <StatCard icon={BarChart3} label="Hit Rate" value={`${(memData.hitRate * 100).toFixed(1)}%`} sub={`${memData.hits} hits`} />
            <StatCard icon={Activity} label="Miss Rate" value={`${(memData.missRate * 100).toFixed(1)}%`} sub={`${memData.misses} misses`} />
            <StatCard icon={Clock} label="TTL" value="10 min" sub="Default expiry" />
          </div>
        )}
        <div className="mt-4">
          <button onClick={handleClearCache} disabled={clearing}
            className="flex items-center gap-2 rounded-xl border border-status-error/30 bg-status-error/5 px-4 py-2 text-xs font-semibold text-status-error hover:bg-status-error/10 disabled:opacity-50">
            {clearing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {clearing ? 'Clearing...' : 'Clear Cache'}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Observability" icon={Activity}>
        {observability.isLoading && <div className="py-4 text-center text-sm text-text-tertiary"><RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" />Loading...</div>}
        {obsData && (
          <>
            <div className="grid gap-4 sm:grid-cols-4 mb-4">
              <StatCard icon={Play} label="Total Dispatches" value={String(obsData.stats.total)} />
              <StatCard icon={CheckCircle2} label="Successful" value={String(obsData.stats.successCount)} sub={obsData.stats.total > 0 ? `${((obsData.stats.successCount / obsData.stats.total) * 100).toFixed(0)}% success rate` : undefined} />
              <StatCard icon={XCircle} label="Failed" value={String(obsData.stats.failedCount)} sub={obsData.stats.total > 0 ? `${((obsData.stats.failedCount / obsData.stats.total) * 100).toFixed(0)}% failure rate` : undefined} />
              <StatCard icon={Clock} label="Avg Latency" value={formatLatency(obsData.stats.avgLatency)} />
            </div>

            {Object.keys(breakdown).length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Action Breakdown</h4>
                <div className="overflow-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-secondary">
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Action</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Total</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Succeeded</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Failed</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown).sort(([, a], [, b]) => b.total - a.total).map(([actionId, stats]) => (
                        <tr key={actionId} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                          <td className="px-3 py-2 font-medium text-text-primary text-xs">{actionId}</td>
                          <td className="px-3 py-2 text-right text-text-primary">{stats.total}</td>
                          <td className="px-3 py-2 text-right text-status-success">{stats.success}</td>
                          <td className="px-3 py-2 text-right text-status-error">{stats.failed}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{formatLatency(stats.avgLatency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {recent.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Recent Events (last 10)</h4>
                <div className="space-y-1.5">
                  {recent.map((ev: ObservabilityEvent, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-3 py-2">
                      {ev.success ? <CheckCircle2 className="h-3.5 w-3.5 text-status-success flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-status-error flex-shrink-0" />}
                      <span className="flex-1 text-xs text-text-primary truncate">{ev.actionName || ev.actionId}</span>
                      <span className="text-[10px] text-text-tertiary">{formatLatency(ev.latencyMs)}</span>
                      <span className="text-[10px] text-text-tertiary">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CollapsibleSection>
    </div>
  )
}
