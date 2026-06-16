'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getIncident,
  updateIncidentStatus,
  addIncidentUpdate,
  type Incident,
} from '@/lib/api/launch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, AlertTriangle } from 'lucide-react';

const severityConfig: Record<string, { variant: 'destructive' | 'warning' | 'default' | 'secondary'; label: string }> = {
  CRITICAL: { variant: 'destructive', label: 'Critical' },
  HIGH: { variant: 'warning', label: 'High' },
  MEDIUM: { variant: 'default', label: 'Medium' },
  LOW: { variant: 'secondary', label: 'Low' },
};

const statusConfig: Record<string, { variant: 'outline' | 'warning' | 'default' | 'secondary' | 'success'; label: string }> = {
  DETECTED: { variant: 'outline', label: 'Detected' },
  INVESTIGATING: { variant: 'warning', label: 'Investigating' },
  IDENTIFIED: { variant: 'default', label: 'Identified' },
  MONITORING: { variant: 'secondary', label: 'Monitoring' },
  RESOLVED: { variant: 'success', label: 'Resolved' },
};

const statusTransitions: Record<string, { next: string; buttonLabel: string }> = {
  DETECTED: { next: 'INVESTIGATING', buttonLabel: 'Start Investigation' },
  INVESTIGATING: { next: 'IDENTIFIED', buttonLabel: 'Mark Identified' },
  IDENTIFIED: { next: 'MONITORING', buttonLabel: 'Start Monitoring' },
  MONITORING: { next: 'RESOLVED', buttonLabel: 'Mark Resolved' },
};

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const [submittingTransition, setSubmittingTransition] = useState(false);
  const [newUpdateMessage, setNewUpdateMessage] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await getIncident(id);
      setIncident(result);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load incident'));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransition = async (nextStatus: string) => {
    setSubmittingTransition(true);
    try {
      await updateIncidentStatus(id, nextStatus, transitionMessage);
      setTransitionTarget(null);
      setTransitionMessage('');
      await fetchData();
    } catch {
      // handled
    } finally {
      setSubmittingTransition(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdateMessage.trim() || !incident) return;
    setSubmittingUpdate(true);
    try {
      await addIncidentUpdate(id, { message: newUpdateMessage, status: incident.status });
      setNewUpdateMessage('');
      await fetchData();
    } catch {
      // handled
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
          <Link href="/admin/launch/incidents" className="hover:text-primary-600 dark:hover:text-primary-400">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to Incidents
          </Link>
        </div>
        <div className="h-8 w-64 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary" />
          <div className="h-48 animate-pulse rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
          <Link href="/admin/launch/incidents" className="hover:text-primary-600 dark:hover:text-primary-400">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to Incidents
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Incident not found</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            The incident you are looking for does not exist or has been removed.
          </p>
          <Button onClick={() => router.push('/admin/launch/incidents')} className="mt-4">
            Back to Incidents
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
          <Link href="/admin/launch/incidents" className="hover:text-primary-600 dark:hover:text-primary-400">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Back to Incidents
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load incident</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  if (!incident) return null;

  const transition = statusTransitions[incident.status];
  const sortedUpdates = [...(incident.updates ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
        <Link href="/admin/launch/incidents" className="inline-flex items-center hover:text-primary-600 dark:hover:text-primary-400">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Incidents
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary sm:text-3xl">
            {incident.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={severityConfig[incident.severity]?.variant ?? 'secondary'}>
              {severityConfig[incident.severity]?.label ?? incident.severity}
            </Badge>
            <Badge variant={statusConfig[incident.status]?.variant ?? 'outline'}>
              {statusConfig[incident.status]?.label ?? incident.status}
            </Badge>
            <span className="text-xs text-text-tertiary">
              Reported {formatDate(incident.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary dark:text-dark-text-primary whitespace-pre-wrap">
              {incident.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impacted Services</CardTitle>
          </CardHeader>
          <CardContent>
            {incident.impactedServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {incident.impactedServices.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No impacted services listed</p>
            )}
            <div className="mt-4 text-sm text-text-secondary dark:text-dark-text-secondary">
              Reported by: <span className="font-medium text-text-primary dark:text-dark-text-primary">{incident.reportedBy ?? 'System'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {transition && (
        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent>
            {transitionTarget === transition.next ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a message about this transition..."
                  value={transitionMessage}
                  onChange={(e) => setTransitionMessage(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button
                    disabled={submittingTransition}
                    onClick={() => handleTransition(transition.next)}
                  >
                    {submittingTransition ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {transition.buttonLabel}
                  </Button>
                  <Button variant="outline" onClick={() => { setTransitionTarget(null); setTransitionMessage(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setTransitionTarget(transition.next)}>
                {transition.buttonLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {sortedUpdates.length === 0 ? (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No updates yet</p>
          ) : (
            <div className="relative space-y-0">
              {sortedUpdates.map((update, idx) => (
                <div key={update.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-3 w-3 shrink-0 rounded-full bg-primary-500" />
                    {idx < sortedUpdates.length - 1 && (
                      <div className="mt-0.5 h-full w-px bg-border dark:bg-dark-border" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[update.status]?.variant ?? 'outline'} className="text-[10px]">
                        {statusConfig[update.status]?.label ?? update.status}
                      </Badge>
                      <span className="text-xs text-text-tertiary">{formatDate(update.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-primary dark:text-dark-text-primary whitespace-pre-wrap">
                      {update.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Update</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="Describe the latest update..."
              value={newUpdateMessage}
              onChange={(e) => setNewUpdateMessage(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">
                Status: <Badge variant={statusConfig[incident.status]?.variant ?? 'outline'}>{statusConfig[incident.status]?.label ?? incident.status}</Badge>
              </span>
              <Button disabled={submittingUpdate || !newUpdateMessage.trim()} onClick={handleAddUpdate}>
                {submittingUpdate ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
