'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getIncidents,
  createIncident,
  type Incident,
} from '@/lib/api/launch';
import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Search, Loader2 } from 'lucide-react';

const severityConfig: Record<string, { variant: 'destructive' | 'warning' | 'default' | 'secondary'; label: string; color: string }> = {
  CRITICAL: { variant: 'destructive', label: 'Critical', color: 'text-red-600' },
  HIGH: { variant: 'warning', label: 'High', color: 'text-amber-600' },
  MEDIUM: { variant: 'default', label: 'Medium', color: 'text-blue-600' },
  LOW: { variant: 'secondary', label: 'Low', color: 'text-text-secondary' },
};

const statusConfig: Record<string, { variant: 'outline' | 'warning' | 'default' | 'secondary' | 'success'; label: string }> = {
  DETECTED: { variant: 'outline', label: 'Detected' },
  INVESTIGATING: { variant: 'warning', label: 'Investigating' },
  IDENTIFIED: { variant: 'default', label: 'Identified' },
  MONITORING: { variant: 'secondary', label: 'Monitoring' },
  RESOLVED: { variant: 'success', label: 'Resolved' },
};

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', impactedServices: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIncidents({
        ...(filterStatus && { status: filterStatus }),
        ...(filterSeverity && { severity: filterSeverity }),
        page: 1,
        limit: 100,
      });
      setIncidents(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load incidents'));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await createIncident({
        title: form.title,
        description: form.description,
        severity: form.severity,
        impactedServices: form.impactedServices
          ? form.impactedServices.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setModalOpen(false);
      setForm({ title: '', description: '', severity: 'MEDIUM', impactedServices: '' });
      await fetchData();
    } catch {
      // handled
    } finally {
      setCreating(false);
    }
  };

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter((i) => i.severity === 'HIGH').length;
  const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Incident Management" description="Track and manage launch incidents" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Incident Management" description="Track and manage launch incidents" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load incidents</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Incident Management"
        description="Track and manage launch incidents"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Critical" value={String(criticalCount)} className="!border-red-200 dark:!border-red-900" />
        <StatCard icon={AlertTriangle} label="High" value={String(highCount)} className="!border-amber-200 dark:!border-amber-900" />
        <StatCard icon={Search} label="Active" value={String(activeCount)} />
        <StatCard icon={AlertTriangle} label="Resolved" value={String(resolvedCount)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-text-tertiary" />
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="MONITORING">Monitoring</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Search className="h-12 w-12 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">No incidents found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {filterStatus || filterSeverity ? 'Try changing your filters' : 'No incidents have been reported yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Card
              key={incident.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/admin/launch/incidents/${incident.id}`)}
            >
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={severityConfig[incident.severity]?.variant ?? 'secondary'}>
                      {severityConfig[incident.severity]?.label ?? incident.severity}
                    </Badge>
                    <Badge variant={statusConfig[incident.status]?.variant ?? 'outline'}>
                      {statusConfig[incident.status]?.label ?? incident.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-base font-semibold text-text-primary dark:text-dark-text-primary">
                    {incident.title}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                    Impacted:{' '}
                    {incident.impactedServices.length > 0
                      ? incident.impactedServices.join(', ')
                      : '-'}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-text-tertiary">
                  <p>{incident.reportedBy ?? 'System'}</p>
                  <p>{formatDate(incident.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl dark:bg-dark-surface dark:border-dark-border">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Report Incident</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Title</label>
                <Input
                  placeholder="Issue title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Description</label>
                <Textarea
                  placeholder="Describe the incident..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">Severity</label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  Impacted Services <span className="text-text-tertiary">(comma-separated)</span>
                </label>
                <Input
                  placeholder="e.g. API, Database, Web"
                  value={form.impactedServices}
                  onChange={(e) => setForm((f) => ({ ...f, impactedServices: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button disabled={creating || !form.title.trim() || !form.description.trim()} onClick={handleCreate}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Report Incident
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
