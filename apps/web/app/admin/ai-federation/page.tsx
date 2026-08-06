'use client';
import { useFederationDashboard, useFederationWorkflows, useCollaborationHistory, useExecuteWorkflow, useCollaborationGraph, useAgentUtilization, useActiveCollaborations, useCancelCollaboration } from '@/hooks/use-ai-federation';
import { useState } from 'react';

export default function AiFederationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'history' | 'graph'>('overview');
  const { data: dashboard, isLoading: dashLoading } = useFederationDashboard();
  const { data: workflows } = useFederationWorkflows();
  const { data: history } = useCollaborationHistory(100, 0);
  const { data: graph } = useCollaborationGraph();
  const { data: utilization } = useAgentUtilization();
  const { data: activeCollabs } = useActiveCollaborations();
  const execWf = useExecuteWorkflow();
  const cancelCollab = useCancelCollaboration();
  const [executingWf, setExecutingWf] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<string | null>(null);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'history', label: 'Execution History' },
    { key: 'graph', label: 'Agent Graph' },
  ] as const;

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <h1 className="page-title">AI Federation Console</h1>
      <p className="page-subtitle">TradeAI Runtime Federation — Multi-Agent Collaboration Platform</p>

      {dashLoading ? (
        <div className="flex items-center justify-center py-20"><div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" /></div>
      ) : (
        <>
          <div className="mb-6 flex gap-1 border-b border-border">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={'px-4 py-2 text-sm font-medium transition-colors ' + (activeTab === t.key ? 'border-b-2 border-accent text-text-primary' : 'text-text-tertiary hover:text-text-secondary')}>{t.label}</button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Registered Agents" value={dashboard?.analytics.totalCollaborations ?? '-'} sub={dashboard?.agents.totalCapabilities + ' capabilities'} />
                <StatCard label="Total Executions" value={dashboard?.analytics.totalCollaborations ?? '-'} sub={dashboard?.analytics.completedCollaborations + ' succeeded'} />
                <StatCard label="Avg Duration" value={dashboard?.analytics.avgDurationMs ? dashboard.analytics.avgDurationMs + 'ms' : '-'} sub={'P95: ' + (dashboard?.analytics.p95DurationMs ?? '-') + 'ms'} />
                <StatCard label="Active Collabs" value={activeCollabs?.length ?? 0} sub={dashboard?.analytics.failedCollaborations + ' failed'} />
              </div>

              <div className="surface-card-lg p-6">
                <h3 className="mb-4 font-semibold text-text-primary">Agent Utilization</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-tertiary">
                        <th className="pb-2 font-medium">Agent</th>
                        <th className="pb-2 font-medium">Total Calls</th>
                        <th className="pb-2 font-medium">Success Rate</th>
                        <th className="pb-2 font-medium">Avg Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(utilization ?? dashboard?.analytics.agentUtilization ?? []).map((a) => (
                        <tr key={a.agentId} className="border-b border-border/50 text-text-secondary">
                          <td className="py-2 capitalize">{a.name}</td>
                          <td className="py-2">{a.totalCalls}</td>
                          <td className="py-2">
                            <span className={'rounded px-2 py-0.5 text-xs ' + (a.successRate >= 0.9 ? 'bg-status-success/20 text-status-success' : a.successRate >= 0.7 ? 'bg-status-warning/20 text-status-warning' : 'bg-status-error/20 text-status-error')}>
                              {Math.round(a.successRate * 100)}%
                            </span>
                          </td>
                          <td className="py-2">{a.avgLatencyMs}ms</td>
                        </tr>
                      ))}
                      {(!dashboard?.analytics.agentUtilization?.length && !utilization?.length) && (
                        <tr><td colSpan={4} className="py-4 text-center text-text-tertiary">No utilization data yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="surface-card-lg p-6">
                <h3 className="mb-4 font-semibold text-text-primary">Active Collaborations</h3>
                {activeCollabs && activeCollabs.length > 0 ? (
                  <ul className="space-y-2">
                    {activeCollabs.map((id) => (
                      <li key={id} className="flex items-center justify-between rounded-lg border border-border/50 bg-bg-elevated px-4 py-2">
                        <span className="text-sm text-text-secondary">{id}</span>
                        <button onClick={() => cancelCollab.mutate(id)} className="rounded bg-status-error/20 px-2 py-1 text-xs text-status-error hover:bg-status-error/30">Cancel</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-tertiary">No active collaborations</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <p className="text-sm text-text-tertiary">Predefined cross-agent workflows. Click Execute to run one now.</p>
              {execResult && (
                <div className={'rounded-lg border p-4 text-sm ' + (execResult.includes('Error') ? 'border-status-error/30 bg-status-error/10 text-status-error' : 'border-status-success/30 bg-status-success/10 text-status-success')}>
                  {execResult}
                </div>
              )}
              {workflows?.map((wf) => (
                <div key={wf.id} className="surface-card-lg p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{wf.name}</h3>
                      <p className="text-sm text-text-tertiary">{wf.description}</p>
                    </div>
                    <button
                      onClick={async () => {
                        setExecutingWf(wf.id);
                        setExecResult(null);
                        try {
                          const r = await execWf.mutateAsync({ workflowId: wf.id, context: { companyId: 'admin', role: 'admin', payload: {} } });
                          setExecResult('Workflow completed in ' + r.totalLatencyMs + 'ms — ' + r.nodes.length + ' nodes, ' + (r.success ? 'All succeeded' : 'Some failed'));
                        } catch (e: unknown) {
                          setExecResult('Error: ' + (e instanceof Error ? e.message : 'Unknown'));
                        } finally {
                          setExecutingWf(null);
                        }
                      }}
                      disabled={executingWf === wf.id}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-btn-primary-text hover:bg-accent/90 disabled:opacity-50"
                    >
                      {executingWf === wf.id ? 'Running...' : 'Execute'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wf.nodes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-border/50 bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary">
                        <span className="capitalize">{n.agentId}</span>
                        <span className="mx-1 text-text-tertiary">/</span>
                        <span className="text-accent">{n.capabilityId}</span>
                        {n.dependsOn && n.dependsOn.length > 0 && (
                          <span className="ml-1 text-text-tertiary">(after: {n.dependsOn.join(', ')})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!workflows || workflows.length === 0) && (
                <div className="py-12 text-center text-text-tertiary">No workflows registered</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="surface-card-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-tertiary">
                      <th className="px-4 py-3 font-medium">Collaboration ID</th>
                      <th className="px-4 py-3 font-medium">Pattern</th>
                      <th className="px-4 py-3 font-medium">Workflow</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Nodes</th>
                      <th className="px-4 py-3 font-medium">Agents</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history?.data ?? []).map((h) => (
                      <tr key={h.collaborationId} className="border-b border-border/50 text-text-secondary hover:bg-bg-elevated/50">
                        <td className="px-4 py-3 font-mono text-xs">{h.collaborationId.slice(0, 8)}...</td>
                        <td className="px-4 py-3 capitalize">{h.pattern}</td>
                        <td className="px-4 py-3">{h.workflowId ?? '-'}</td>
                        <td className="px-4 py-3">{h.durationMs}ms</td>
                        <td className="px-4 py-3">{h.nodeCount}</td>
                        <td className="px-4 py-3">
                          {h.agentIds.map((a) => (
                            <span key={a} className="mr-1 rounded bg-bg-elevated px-1.5 py-0.5 text-xs capitalize">{a}</span>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={'rounded px-2 py-0.5 text-xs ' + (h.success ? 'bg-status-success/20 text-status-success' : 'bg-status-error/20 text-status-error')}>
                            {h.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!history?.data || history.data.length === 0) && (
                      <tr><td colSpan={7} className="py-12 text-center text-text-tertiary">No execution history yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="surface-card-lg p-6 lg:col-span-2">
                <h3 className="mb-4 font-semibold text-text-primary">Collaboration Graph</h3>
                {graph?.nodes && graph.nodes.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {graph.nodes.map((n) => (
                        <div key={n.id} className={'rounded-lg border px-4 py-3 text-sm ' + (n.group === 'executive' ? 'border-accent/30 bg-accent/10' : n.group === 'platform' ? 'border-blue-500/30 bg-blue-500/10' : 'border-green-500/30 bg-green-500/10')}>
                          <div className="font-medium capitalize text-text-primary">{n.name}</div>
                          <div className="text-xs text-text-tertiary">{n.group}</div>
                        </div>
                      ))}
                    </div>
                    {graph.links.length > 0 && (
                      <>
                        <h4 className="mt-4 text-sm font-medium text-text-secondary">Collaboration Paths</h4>
                        <div className="flex flex-wrap gap-2">
                          {graph.links.map((l, i) => (
                            <div key={i} className="flex items-center gap-1 rounded bg-bg-elevated px-2 py-1 text-xs text-text-tertiary">
                              <span className="capitalize text-text-secondary">{l.source}</span>
                              <span>→</span>
                              <span className="capitalize text-text-secondary">{l.target}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="py-8 text-center text-text-tertiary">No collaboration data available</p>
                )}
              </div>

              <div className="surface-card-lg p-6">
                <h3 className="mb-4 font-semibold text-text-primary">Agent Breakdown</h3>
                {graph?.nodes ? (
                  <div className="space-y-3">
                    {graph.nodes.map((n) => {
                      const linkCount = graph.links.filter((l) => l.source === n.id || l.target === n.id).length;
                      return (
                        <div key={n.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-bg-elevated px-3 py-2">
                          <div>
                            <div className="text-sm font-medium capitalize text-text-primary">{n.name}</div>
                            <div className="text-xs text-text-tertiary">{n.group}</div>
                          </div>
                          <div className="rounded bg-bg-base px-2 py-0.5 text-xs text-text-tertiary">{linkCount} connections</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-text-tertiary">No agents</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface-card-lg p-4">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-tertiary">{sub}</div>}
    </div>
  );
}
