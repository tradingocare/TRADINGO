'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminCrmDashboard, useLeads, usePipelineStages, useDeletePipelineStage, useCreatePipelineStage } from '@/hooks/use-crm';
import { toast } from '@/components/ui/use-toast';
import { Users, TrendingUp, Target, XCircle, Layers, Plus, Trash2, Settings, BarChart3, Sparkles, Loader2, Activity } from 'lucide-react';
import { useAiCrmPipelineHealth, useAiCrmForecast } from '@/hooks/use-ai-crm';
import { Label } from '@/components/ui/label';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400', CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400', PROPOSAL: 'bg-indigo-500/20 text-indigo-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400', WON: 'bg-green-500/20 text-green-400',
  LOST: 'bg-red-500/20 text-red-400', DISQUALIFIED: 'bg-gray-500/20 text-gray-400',
};

export default function AdminCrmPage() {
  const { data: dashboard, isLoading: dashLoading } = useAdminCrmDashboard();
  const { data: leadsData, isLoading } = useLeads({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const deleteStageMutation = useDeletePipelineStage();
  const createStageMutation = useCreatePipelineStage();
  const [showStageForm, setShowStageForm] = useState(false);
  const [stageForm, setStageForm] = useState({ name: '', color: '#6366f1', isWon: false, isLost: false });
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiPipelineHealth = useAiCrmPipelineHealth();
  const aiForecast = useAiCrmForecast();

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await createStageMutation.mutateAsync(stageForm); toast({ title: 'Stage created' }); setShowStageForm(false); setStageForm({ name: '', color: '#6366f1', isWon: false, isLost: false }); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="CRM Admin" description="Lead management overview" actions={
        <div className="flex gap-2">
          <Link href="/admin/crm/reports"><Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> Reports</Button></Link>
          <Button onClick={() => setShowStageForm(true)}><Plus className="mr-2 h-4 w-4" /> Add Stage</Button>
        </div>
      } />

      {showStageForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowStageForm(false)}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Pipeline Stage</h2>
            <form onSubmit={handleCreateStage} className="space-y-4">
              <div><Label>Name *</Label><Input required value={stageForm.name} onChange={e => setStageForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Color</Label><Input type="color" value={stageForm.color} onChange={e => setStageForm(p => ({ ...p, color: e.target.value }))} /></div>
              <div className="flex gap-4"><Label className="flex items-center gap-2"><input type="checkbox" checked={stageForm.isWon} onChange={e => setStageForm(p => ({ ...p, isWon: e.target.checked }))} /> Is Won</Label><Label className="flex items-center gap-2"><input type="checkbox" checked={stageForm.isLost} onChange={e => setStageForm(p => ({ ...p, isLost: e.target.checked }))} /> Is Lost</Label></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowStageForm(false)}>Cancel</Button>
                <Button type="submit">Create Stage</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dashLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Leads" value={String(dashboard.totalLeads)} />
          <StatCard icon={TrendingUp} label="Pipeline Value" value={`₹${Number(dashboard.pipelineValue).toLocaleString()}`} />
          {dashboard.byStatus?.map((s: any) => <StatCard key={s.status} icon={Target} label={s.status} value={String(s.count)} />)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Pipeline Stages</CardTitle></CardHeader>
          <CardContent>
            {stagesLoading ? <TableSkeleton rows={3} /> : !stages || stages.length === 0 ? <p className="text-sm text-gray-400">No stages configured</p> : (
              <div className="space-y-2">
                {stages.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg" style={{ borderLeft: `4px solid ${s.color}` }}>
                    <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-gray-400">Order: {s.order} • Leads: {s._count?.leads || 0}{s.isWon ? ' • Won' : ''}{s.isLost ? ' • Lost' : ''}</p></div>
                    <Button size="sm" variant="ghost" onClick={async () => { try { await deleteStageMutation.mutateAsync(s.id); toast({ title: 'Stage deleted' }); } catch (e: any) { toast({ title: e?.response?.data?.message || 'Failed', variant: 'destructive' }); } }}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Leads</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <TableSkeleton rows={5} /> : !leadsData?.data?.length ? <div className="p-8 text-center text-gray-400">No leads yet</div> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400"><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Source</th><th className="p-3"></th></tr></thead>
                  <tbody>
                    {leadsData.data.slice(0, 8).map((lead: any) => (
                      <tr key={lead.id} className="border-b border-gray-700/50">
                        <td className="p-3 text-sm">{lead.name}</td>
                        <td className="p-3"><Badge className={STATUS_STYLES[lead.status] || ''}>{lead.status}</Badge></td>
                        <td className="p-3 text-sm text-gray-400">{lead.source || '-'}</td>
                        <td className="p-3"><Link href={`/seller/crm/${lead.id}`}><Button variant="ghost" size="sm">View</Button></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
        <CardContent>
          {!dashboard?.bySource?.length ? <p className="text-sm text-gray-400">No data</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboard.bySource.map((s: any) => (
                <div key={s.source} className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-gray-400">{s.source}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-400" /> AI Pipeline Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button size="sm" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try {
                const stages = dashboard?.byStatus?.map((s: any) => ({ name: s.status, count: s.count, value: 0 })) || [];
                const r = await aiPipelineHealth.mutateAsync({ stages, totalPipelineValue: Number(dashboard?.pipelineValue || 0), activeLeads: stages.reduce((a: number, s: any) => a + s.count, 0), conversionRate: 0 });
                setAiResult(r.data); toast({ title: 'Pipeline health assessment ready' });
              } catch { toast({ title: 'Pipeline health failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} Pipeline Health
            </Button>
            <Button size="sm" variant="outline" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try {
                const stages = dashboard?.byStatus?.map((s: any) => ({ name: s.status, count: s.count, value: 0 })) || [];
                const activeDeals = stages.reduce((a: number, s: any) => a + s.count, 0);
                const r = await aiForecast.mutateAsync({ currentPipelineValue: Number(dashboard?.pipelineValue || 0), activeDeals, historicalConversionRate: 0.25, avgDealSize: activeDeals > 0 ? Number(dashboard?.pipelineValue || 0) / activeDeals : 0 });
                setAiResult(r.data); toast({ title: 'Forecast ready' });
              } catch { toast({ title: 'Forecast failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Forecast
            </Button>
          </div>
          {aiResult && (
            <pre className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(aiResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
