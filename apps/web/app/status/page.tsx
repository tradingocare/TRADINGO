'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getActiveIncidents, getIncidents, type Incident } from '@/lib/api/launch';

type OverallStatus = 'operational' | 'degraded' | 'disruption';

function severityColor(severity: Incident['severity']): string {
  switch (severity) {
    case 'CRITICAL': return 'bg-status-error';
    case 'HIGH': return 'bg-status-warning';
    case 'MEDIUM': return 'bg-status-warning/60';
    case 'LOW': return 'bg-status-info';
  }
}

function statusLabel(status: Incident['status']): string {
  switch (status) {
    case 'DETECTED': return 'Detected';
    case 'INVESTIGATING': return 'Investigating';
    case 'IDENTIFIED': return 'Identified';
    case 'MONITORING': return 'Monitoring';
    case 'RESOLVED': return 'Resolved';
  }
}

function overallStatusBadge(status: OverallStatus) {
  switch (status) {
    case 'operational':
      return { icon: CheckCircle2, text: 'All Systems Operational', className: 'text-status-success bg-status-success/10 border-status-success/20' };
    case 'degraded':
      return { icon: AlertTriangle, text: 'Degraded Performance', className: 'text-status-warning bg-status-warning/10 border-status-warning/20' };
    case 'disruption':
      return { icon: AlertCircle, text: 'Service Disruption', className: 'text-status-error bg-status-error/10 border-status-error/20' };
  }
}

function IncidentCard({ incident }: { incident: Incident }) {
  const SeverityIcon = incident.severity === 'CRITICAL' ? AlertCircle : AlertTriangle;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <SeverityIcon className="mt-1 h-5 w-5 flex-shrink-0 text-status-error" />
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{incident.title}</CardTitle>
                <Badge className={severityColor(incident.severity)}>
                  {incident.severity}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary ">
                {incident.description}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="flex-shrink-0 gap-1">
            <Clock className="h-3 w-3" />
            {statusLabel(incident.status)}
          </Badge>
        </div>
      </CardHeader>
      {(incident.impactedServices.length > 0 || (incident.updates && incident.updates.length > 0)) && (
        <CardContent className="space-y-4">
          {incident.impactedServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-text-tertiary ">Impacted:</span>
              {incident.impactedServices.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
          {incident.updates && incident.updates.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-tertiary  uppercase tracking-wider">
                Latest Updates
              </p>
              {incident.updates.slice(-3).map((update) => (
                <div key={update.id} className="rounded-lg border border-border bg-surface-secondary/50 p-3  ">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-accent">
                      {statusLabel(update.status as Incident['status'])}
                    </span>
                    <span className="text-xs text-text-tertiary ">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary ">
                    {update.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function StatusPage() {
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [resolvedIncidents, setResolvedIncidents] = useState<Incident[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    try {
      const [active, all] = await Promise.all([
        getActiveIncidents(),
        getIncidents({ status: 'RESOLVED', limit: 10 }),
      ]);
      setActiveIncidents(active);
      setResolvedIncidents(all);
      setLastChecked(new Date());
    } catch {
      // Silently handle — UI will show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 60_000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const hasCritical = activeIncidents.some((i) => i.severity === 'CRITICAL');
  const overall: OverallStatus = activeIncidents.length === 0
    ? 'operational'
    : hasCritical
      ? 'disruption'
      : 'degraded';

  const OverallIcon = overallStatusBadge(overall).icon;

  return (
    <>
      <PageHeader
        title="TRADINGO Status"
        description="Current operational status of all TRADINGO services."
      />

      <section className="py-12 ">
        <div className="container-main">
          <div className={`flex flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-sm ${overallStatusBadge(overall).className}`}>
            <OverallIcon className="h-12 w-12" />
            <div>
              <p className="text-2xl font-bold">{overallStatusBadge(overall).text}</p>
              <p className="mt-1 text-sm opacity-80">
                Last checked: {lastChecked.toLocaleString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchIncidents} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-main">
          <SectionHeader
            title="Active Incidents"
            subtitle="Ongoing incidents we are currently working on."
          />
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-text-tertiary " />
            </div>
          ) : activeIncidents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-status-success" />
              <p className="text-xl font-semibold text-text-primary ">
                No active incidents
              </p>
              <p className="text-sm text-text-secondary ">
                All TRADINGO services are operating normally.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Separator />

      <section className="py-20 ">
        <div className="container-main">
          <SectionHeader
            title="Recent Resolved Incidents"
            subtitle="Previously resolved incidents for transparency."
          />
          {resolvedIncidents.length === 0 ? (
            <p className="text-center text-text-secondary ">
              No resolved incidents to display.
            </p>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {resolvedIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-status-success" />
                      <div>
                        <p className="font-medium text-text-primary ">
                          {incident.title}
                        </p>
                        <p className="text-xs text-text-tertiary ">
                          Resolved {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-status-success">
                      Resolved
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
