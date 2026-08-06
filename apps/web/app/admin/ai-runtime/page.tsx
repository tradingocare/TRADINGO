'use client'

import { useState } from 'react'
import {
  Cpu, Activity, AlertTriangle, CheckCircle2, XCircle, Clock,
  RefreshCw, Zap, Shield, BarChart3, Server, Gauge, TrendingUp,
  ChevronDown, ChevronRight, Play, Square, Trash2, Settings,
  AlertOctagon, Wifi, Slash,
} from 'lucide-react'
import { useQueueCounts, useCircuitBreakers, useSlaStatuses, useTelemetry, useProviderStats, useAiTasks, useCancelTask, useResetAllCircuitBreakers, useSetCircuitBreakerConfig, useSetSlaConfig, useAiRuntimeHealth } from '@/hooks/use-ai-runtime'

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

function StatCard({ icon: Icon, label, value, sub, variant = 'default' }: { icon: any; label: string; value: string; sub?: string; variant?: 'default' | 'success' | 'danger' | 'warning' }) {
  const accentClass = variant === 'success' ? 'text-emerald-400' : variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-amber-400' : 'text-accent'
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass.replace('text-', 'bg-').replace('emerald-400', 'emerald-400/10').replace('red-400', 'red-400/10').replace('amber-400', 'amber-400/10').replace('accent', 'accent/10')}`}>
          <Icon className={`h-5 w-5 ${accentClass}`} />
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

function CircuitBadge({ state }: { state: string }) {
  if (state === 'CLOSED') return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Closed</span>
  if (state === 'HALF_OPEN') return <span className="flex items-center gap-1 text-xs text-amber-400"><AlertTriangle className="h-3 w-3" />Half-Open</span>
  return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3" />Open</span>
}

function SlaBadge({ slaMet }: { slaMet: boolean }) {
  if (slaMet) return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Met</span>
  return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3" />Breached</span>
}

function TaskBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Done</span>
  if (status === 'RUNNING') return <span className="flex items-center gap-1 text-xs text-blue-400"><Activity className="h-3 w-3" />Running</span>
  if (status === 'QUEUED') return <span className="flex items-center gap-1 text-xs text-amber-400"><Clock className="h-3 w-3" />Queued</span>
  if (status === 'FAILED') return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3 w-3" />Failed</span>
  if (status === 'TIMEOUT') return <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" />Timeout</span>
  return <span className="flex items-center gap-1 text-xs text-text-tertiary"><Slash className="h-3 w-3" />{status}</span>
}

export default function AiRuntimePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'circuit' | 'sla' | 'providers'>('dashboard')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Server size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-black text-text-primary">AI Runtime Console</h1>
          <p className="text-xs text-text-tertiary">Agent runtime, reliability, circuit breakers, SLA monitoring, and provider health</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface-secondary p-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Gauge },
          { id: 'tasks', label: 'Tasks', icon: Activity },
          { id: 'circuit', label: 'Circuit Breakers', icon: Shield },
          { id: 'sla', label: 'SLA Monitor', icon: TrendingUp },
          { id: 'providers', label: 'Providers', icon: Wifi },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-accent text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'circuit' && <CircuitBreakerTab />}
      {activeTab === 'sla' && <SlaTab />}
      {activeTab === 'providers' && <ProvidersTab />}
    </div>
  )
}

function DashboardTab() {
  const { data: telemetry, isLoading: telLoading, error: telError } = useTelemetry()
  const { data: queueCounts } = useQueueCounts()
  const { data: health } = useAiRuntimeHealth()
  const { mutate: resetAll, isPending: resetting } = useResetAllCircuitBreakers()

  if (telLoading) return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-accent" /></div>
  if (telError) return <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">Failed to load telemetry data</div>

  const t = telemetry as any

  return (
    <div className="space-y-4">
      <CollapsibleSection title="System Health" icon={Server}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Activity} label="Queue Depth" value={String(t?.queueDepth ?? 0)} sub={`${t?.waitingJobs ?? 0} waiting, ${t?.activeWorkers ?? 0} active`} />
          <StatCard icon={Gauge} label="Worker Utilization" value={`${t?.workerUtilizationPct ?? 0}%`} />
          <StatCard icon={CheckCircle2} label="Completed (24h)" value={String(t?.completedJobs24h ?? 0)} variant="success" />
          <StatCard icon={XCircle} label="Failed (24h)" value={String(t?.failedJobs24h ?? 0)} variant={t?.failedJobs24h > 0 ? 'danger' : 'success'} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={Clock} label="Avg Latency (24h)" value={formatLatency(t?.avgLatencyMs24h ?? 0)} />
          <StatCard icon={BarChart3} label="P95 Latency" value={formatLatency(t?.p95LatencyMs24h ?? 0)} variant={t?.p95LatencyMs24h > 10000 ? 'danger' : 'default'} />
          <StatCard icon={TrendingUp} label="P99 Latency" value={formatLatency(t?.p99LatencyMs24h ?? 0)} variant={t?.p99LatencyMs24h > 20000 ? 'danger' : 'default'} />
          <StatCard icon={AlertTriangle} label="SLA Breaches (24h)" value={String(t?.slaBreaches24h ?? 0)} variant={t?.slaBreaches24h > 0 ? 'warning' : 'success'} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => resetAll()} disabled={resetting} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary">
            <RefreshCw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} />
            Reset All Circuit Breakers
          </button>
        </div>
        {t?.topErrors?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-text-secondary">Top Errors (24h)</p>
            <div className="space-y-1">
              {t.topErrors.map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface px-3 py-1.5">
                  <span className="text-xs text-text-secondary">{e.error}</span>
                  <span className="text-xs font-bold text-text-primary">{e.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Circuit Breaker Summary" icon={Shield}>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={CheckCircle2} label="Closed" value={String(t?.circuitBreakers?.closed ?? 0)} variant="success" />
          <StatCard icon={AlertTriangle} label="Half-Open" value={String(t?.circuitBreakers?.halfOpen ?? 0)} variant="warning" />
          <StatCard icon={XCircle} label="Open" value={String(t?.circuitBreakers?.open ?? 0)} variant={t?.circuitBreakers?.open > 0 ? 'danger' : 'success'} />
        </div>
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-text-secondary">AI Runtime Status: <span className="font-bold text-text-primary">{health?.status ?? 'unknown'}</span></p>
          <p className="text-xs text-text-secondary">Queue: {health?.queue?.active ?? 0} active / {health?.queue?.waiting ?? 0} waiting</p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Queue Counts" icon={BarChart3} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          <StatCard icon={Clock} label="Waiting" value={String(queueCounts?.waiting ?? 0)} />
          <StatCard icon={Activity} label="Active" value={String(queueCounts?.active ?? 0)} />
          <StatCard icon={CheckCircle2} label="Completed" value={String(queueCounts?.completed ?? 0)} variant="success" />
          <StatCard icon={XCircle} label="Failed" value={String(queueCounts?.failed ?? 0)} variant={(queueCounts?.failed ?? 0) > 0 ? 'danger' : 'success'} />
          <StatCard icon={Clock} label="Delayed" value={String(queueCounts?.delayed ?? 0)} />
          <StatCard icon={Square} label="Paused" value={String(queueCounts?.paused ?? 0)} />
        </div>
      </CollapsibleSection>
    </div>
  )
}

function TasksTab() {
  const { data: tasksData, isLoading } = useAiTasks()
  const { mutate: cancelTask } = useCancelTask()
  const [statusFilter, setStatusFilter] = useState('')

  if (isLoading) return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-accent" /></div>

  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData as any)?.data ?? []
  const filtered = statusFilter ? tasks.filter((t: any) => t.status === statusFilter) : tasks

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-accent text-primary' : 'border border-border bg-surface text-text-secondary hover:text-text-primary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <Activity className="mb-2 h-8 w-8" />
          <p className="text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Action</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Priority</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Progress</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Created</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((task: any) => (
                <tr key={task.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{task.id}</td>
                  <td className="px-4 py-3 text-xs text-text-primary">{task.type}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{task.actionId || '-'}</td>
                  <td className="px-4 py-3"><TaskBadge status={task.status} /></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{task.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface">
                        <div className={`h-full rounded-full transition-all ${task.progress >= 100 ? 'bg-emerald-400' : task.status === 'FAILED' ? 'bg-red-400' : 'bg-accent'}`} style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-text-tertiary">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-text-tertiary">{new Date(task.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {(task.status === 'QUEUED' || task.status === 'RUNNING') && (
                      <button onClick={() => cancelTask(task.id)} className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[10px] text-red-400 hover:bg-red-400/10">
                        <Trash2 className="h-3 w-3" /> Cancel
                      </button>
                    )}
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

function CircuitBreakerTab() {
  const { data: circuitData, isLoading } = useCircuitBreakers()
  const { mutate: setConfig } = useSetCircuitBreakerConfig()
  const { mutate: resetAll, isPending: resetting } = useResetAllCircuitBreakers()
  const [editId, setEditId] = useState<string | null>(null)
  const [threshold, setThreshold] = useState('3')

  if (isLoading) return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-accent" /></div>

  const circuits = Array.isArray(circuitData) ? circuitData : []
  const openCount = circuits.filter((c: any) => c.state === 'OPEN').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">{circuits.length} breakers, {openCount} open</p>
        <button onClick={() => resetAll()} disabled={resetting} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary">
          <RefreshCw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} />
          Reset All
        </button>
      </div>

      {circuits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <Shield className="mb-2 h-8 w-8" />
          <p className="text-sm">No circuit breaker states recorded</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Key</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">State</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Failures</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Rate/Total</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Cooldown</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Half-Open Reqs</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Last Failure</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {circuits.map((cb: any) => (
                <tr key={cb.actionId || cb.providerName || Math.random()} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">{cb.actionId || cb.providerName || '-'}</td>
                  <td className="px-4 py-3"><CircuitBadge state={cb.state} /></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{cb.failureCount}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{cb.totalRequestCount > 0 ? `${(cb.failureRate * 100).toFixed(0)}% (${cb.failureCount}/${cb.totalRequestCount})` : '0%'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{cb.cooldownRemainingMs ? formatLatency(cb.cooldownRemainingMs) : '-'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{cb.halfOpenRequests}/{cb.halfOpenMaxRequests}</td>
                  <td className="px-4 py-3 text-[10px] text-text-tertiary">{cb.lastFailureAt ? new Date(cb.lastFailureAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditId(cb.actionId || cb.providerName); setThreshold(String(cb.failureRateThreshold || 0.5)) }}
                      className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[10px] text-text-secondary hover:text-text-primary">
                      <Settings className="h-3 w-3" /> Config
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-bold text-text-primary">Configure: {editId}</p>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary">Failure Rate (0-1):</label>
            <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
              className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary" min="0" max="1" step="0.05" />
            <button onClick={() => { setConfig({ failureRateThreshold: parseFloat(threshold), actionId: editId }); setEditId(null) }}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-primary">
              Save
            </button>
            <button onClick={() => setEditId(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SlaTab() {
  const { data: slaData, isLoading } = useSlaStatuses()
  const { mutate: setSlaConfig } = useSetSlaConfig()
  const [editActionId, setEditActionId] = useState<string | null>(null)
  const [alertThreshold, setAlertThreshold] = useState('20000')

  if (isLoading) return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-accent" /></div>

  const slaList = Array.isArray(slaData) ? slaData : []

  return (
    <div className="space-y-4">
      {slaList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <TrendingUp className="mb-2 h-8 w-8" />
          <p className="text-sm">No SLA data recorded yet. Activity will appear after AI tasks are processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Action</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Requests</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Avg</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">P50</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">P95</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">P99</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Breaches</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Rate</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slaList.map((sla: any) => (
                <tr key={sla.actionId} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">{sla.actionId}</td>
                  <td className="px-4 py-3"><SlaBadge slaMet={sla.slaMet} /></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{sla.totalRequests}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{formatLatency(sla.avgLatencyMs)}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{formatLatency(sla.p50LatencyMs)}</td>
                  <td className={`px-4 py-3 text-xs font-medium ${sla.p95LatencyMs > sla.slaTargetMs ? 'text-red-400' : 'text-text-primary'}`}>{formatLatency(sla.p95LatencyMs)}</td>
                  <td className={`px-4 py-3 text-xs font-medium ${sla.p99LatencyMs > sla.slaTargetMs * 2 ? 'text-red-400' : 'text-text-primary'}`}>{formatLatency(sla.p99LatencyMs)}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{sla.breaches}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{sla.breachRate}%</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditActionId(sla.actionId); setAlertThreshold(String(sla.slaTargetMs)) }}
                      className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[10px] text-text-secondary hover:text-text-primary">
                      <Settings className="h-3 w-3" /> Threshold
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editActionId && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm font-bold text-text-primary">SLA Threshold: {editActionId}</p>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary">Alert Threshold (ms):</label>
            <input type="number" value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)}
              className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text-primary" min="1000" step="1000" />
            <button onClick={() => { setSlaConfig({ actionId: editActionId, alertThresholdMs: parseInt(alertThreshold) }); setEditActionId(null) }}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-primary">
              Save
            </button>
            <button onClick={() => setEditActionId(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProvidersTab() {
  const { data: providerData, isLoading } = useProviderStats()

  if (isLoading) return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-accent" /></div>

  const providers = Array.isArray(providerData) ? providerData : []

  return (
    <div className="space-y-4">
      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
          <Wifi className="mb-2 h-8 w-8" />
          <p className="text-sm">No provider data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Provider</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Priority</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Failures</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Circuit</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Enabled</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Last Success</th>
                <th className="px-4 py-3 text-xs font-medium text-text-tertiary">Last Health Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {providers.map((p: any) => (
                <tr key={p.name} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-xs text-text-primary">{p.displayName || p.name}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{p.providerType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.healthStatus === 'ACTIVE' ? 'text-emerald-400' : p.healthStatus === 'DEGRADED' ? 'text-amber-400' : 'text-red-400'}`}>
                      {p.healthStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{p.priority}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{p.failureCount}</td>
                  <td className="px-4 py-3">
                    {p.circuitOpen ? <span className="text-xs text-red-400">Open</span> : <span className="text-xs text-emerald-400">Closed</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-text-tertiary">{p.lastSuccessAt ? new Date(p.lastSuccessAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-[10px] text-text-tertiary">{p.lastHealthCheckAt ? new Date(p.lastHealthCheckAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
