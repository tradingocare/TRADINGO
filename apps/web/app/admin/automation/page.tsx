'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs } from '@/components/ui/tabs';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { listWorkflows, createWorkflow, getWorkflowStats, executeWorkflow, deleteWorkflow } from '@/lib/api/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Play, Trash2, List } from 'lucide-react';

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead Created', LEAD_STATUS_CHANGED: 'Lead Status Changed', LEAD_SCORE_CHANGED: 'Lead Score Changed',
  ORDER_PLACED: 'Order Placed', ORDER_COMPLETED: 'Order Completed', SUBSCRIPTION_STARTED: 'Subscription Started',
  SUBSCRIPTION_EXPIRED: 'Subscription Expired', CAMPAIGN_COMPLETED: 'Campaign Completed', SCHEDULED: 'Scheduled', MANUAL: 'Manual',
};

export default function AdminAutomationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('workflows');
  const [page, setPage] = useState(1);
  const [newWf, setNewWf] = useState({ name: '', description: '', trigger: 'MANUAL', conditions: '{}', actions: '[{"type":"send_notification","template":"GENERIC"}]' });

  const { data: stats } = useQuery({ queryKey: ['workflows', 'stats'], queryFn: getWorkflowStats });
  const { data: wfData, isLoading: wfLoading } = useQuery({ queryKey: ['workflows', page], queryFn: () => listWorkflows({ page, limit: 20 }) });

  const createMutation = useMutation({
    mutationFn: () => createWorkflow({ name: newWf.name, description: newWf.description, trigger: newWf.trigger as any, conditions: JSON.parse(newWf.conditions), actions: JSON.parse(newWf.actions) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); setNewWf({ name: '', description: '', trigger: 'MANUAL', conditions: '{}', actions: '[{"type":"send_notification","template":"GENERIC"}]' }); },
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => executeWorkflow(id, 'manual', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const tabs = [
    { value: 'workflows', label: 'Workflows', icon: <List className="h-4 w-4" /> },
    { value: 'create', label: 'New Workflow', icon: <Workflow className="h-4 w-4" /> },
    { value: 'logs', label: 'Execution Logs', icon: <Play className="h-4 w-4" /> },
  ];

  const renderTabContent = () => {
    switch (tab) {
      case 'workflows':
        return (
          <Card>
            <CardHeader><CardTitle>Automation Workflows</CardTitle></CardHeader>
            <CardContent>
              {wfLoading ? <TableSkeleton rows={5} /> : (
                <Table><THead><TR><TH>Name</TH><TH>Trigger</TH><TH>Status</TH><TH>Runs</TH><TH>Actions</TH></TR></THead>
                  <TBody>{wfData?.data?.length ? wfData.data.map((w: any) => (
                    <TR key={w.id}>
                      <TD>{w.name}</TD>
                      <TD><Badge variant="outline">{TRIGGER_LABELS[w.trigger] || w.trigger}</Badge></TD>
                      <TD><Badge className={w.status === 'ACTIVE' ? 'bg-green-500/15 text-green-400' : 'bg-surface-secondary text-text-tertiary'}>{w.status}</Badge></TD>
                      <TD>{w.runCount}</TD>
                      <TD className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => executeMutation.mutate(w.id)} disabled={executeMutation.isPending}><Play className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(w.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                      </TD>
                    </TR>
                  )) : <TR><TD colSpan={5} className="text-center text-text-tertiary py-8">No workflows defined</TD></TR>}</TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      case 'create':
        return (
          <Card>
            <CardHeader><CardTitle>Create Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm text-text-tertiary">Name</label><Input value={newWf.name} onChange={(e) => setNewWf(p => ({ ...p, name: e.target.value }))} placeholder="Workflow name" /></div>
              <div><label className="text-sm text-text-tertiary">Description</label><Input value={newWf.description} onChange={(e) => setNewWf(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
              <div><label className="text-sm text-text-tertiary">Trigger</label>
                <select value={newWf.trigger} onChange={(e) => setNewWf(p => ({ ...p, trigger: e.target.value }))} className="w-full h-10 rounded-lg bg-surface border-border text-text-primary px-3">
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-sm text-text-tertiary">Conditions (JSON)</label><Textarea value={newWf.conditions} onChange={(e) => setNewWf(p => ({ ...p, conditions: e.target.value }))} rows={3} /></div>
              <div><label className="text-sm text-text-tertiary">Actions (JSON array)</label><Textarea value={newWf.actions} onChange={(e) => setNewWf(p => ({ ...p, actions: e.target.value }))} rows={4} /></div>
              <Button onClick={() => createMutation.mutate()} disabled={!newWf.name}>
                <List className="h-4 w-4 mr-1" /> Create Workflow
              </Button>
            </CardContent>
          </Card>
        );
      case 'logs':
        return (
          <Card>
            <CardHeader><CardTitle>Recent Execution Logs</CardTitle></CardHeader>
            <CardContent>
              {stats?.recentLogs?.length ? (
                <Table><THead><TR><TH>Workflow</TH><TH>Status</TH><TH>Result</TH><TH>Executed</TH></TR></THead>
                  <TBody>{stats.recentLogs.map((log: any) => (
                    <TR key={log.id}>
                      <TD>{log.workflow?.name || '-'}</TD>
                      <TD><Badge className={log.status === 'SUCCESS' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}>{log.status}</Badge></TD>
                      <TD className="text-text-tertiary">{log.result || '-'}</TD>
                      <TD>{new Date(log.executedAt).toLocaleString()}</TD>
                    </TR>
                  ))}</TBody>
                </Table>
              ) : <p className="text-text-tertiary text-center py-8">No execution logs yet</p>}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Marketing Automation" description="Automate workflows triggered by platform events" />

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={List} label="Total Workflows" value={String(stats.totalWorkflows)} />
          <StatCard icon={Play} label="Active" value={String(stats.activeWorkflows)} />
          <StatCard icon={Workflow} label="Recent Executions" value={String(stats.recentLogs?.length ?? 0)} />
        </div>
      ) : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)}</div>}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {renderTabContent()}
    </div>
  );
}
