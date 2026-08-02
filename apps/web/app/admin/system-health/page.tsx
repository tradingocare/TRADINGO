'use client';

import { useState, useEffect } from 'react';
import { DashboardPageHeader, StatCard } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import { Server, Database, Wifi, Cpu, HardDrive, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface HealthCheck {
  status: string;
  message?: string;
}

interface HealthResponse {
  status: string;
  checks: Record<string, HealthCheck>;
}

export default function SystemHealthPage() {
  const [live, setLive] = useState<{ status: string } | null>(null);
  const [ready, setReady] = useState<HealthResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [liveRes, readyRes, healthRes] = await Promise.all([
        apiClient.get<{ status: string }>('/live').catch(() => null),
        apiClient.get<HealthResponse>('/ready').catch(() => null),
        apiClient.get<HealthResponse>('/health').catch(() => null),
      ]);
      setLive(liveRes);
      setReady(readyRes);
      setHealth(healthRes);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch system health', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 15000); return () => clearInterval(id) }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="System Health" description="Monitor the status and performance of platform services" />
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-accent" /></div>
      </div>
    );
  }

  const isOk = (s?: string) => s === 'ok' || s === 'up';
  const apiStatus = isOk(live?.status) ? 'Healthy' : 'Down';
  const allChecks = ready?.checks || health?.checks || {};

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="System Health" description="Monitor the status and performance of platform services" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Server} label="API Status" value={apiStatus} change={live?.status || 'unknown'} changeType={isOk(live?.status) ? 'positive' : 'negative'} />
        <StatCard icon={Database} label="Database" value={isOk(allChecks.database?.status) ? 'Healthy' : 'Down'} change={allChecks.database?.status || 'unknown'} changeType={isOk(allChecks.database?.status) ? 'positive' : 'negative'} />
        <StatCard icon={Cpu} label="Redis" value={isOk(allChecks.redis?.status) ? 'Healthy' : 'Down'} change={allChecks.redis?.status || 'unknown'} changeType={isOk(allChecks.redis?.status) ? 'positive' : 'negative'} />
        <StatCard icon={Wifi} label="OpenSearch" value={isOk(allChecks.opensearch?.status) ? 'Healthy' : 'Down'} change={allChecks.opensearch?.status || 'N/A'} changeType={isOk(allChecks.opensearch?.status) ? 'positive' : 'negative'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Object.keys(allChecks).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-text-tertiary">No health data available</CardContent></Card>
        ) : (
          Object.entries(allChecks).map(([name, check]) => (
            <Card key={name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isOk(check.status) ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                    {name === 'database' ? <Database className="h-5 w-5" /> : name === 'redis' ? <Cpu className="h-5 w-5" /> : name === 'opensearch' ? <Wifi className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base capitalize">{name}</CardTitle>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${isOk(check.status) ? 'bg-accent' : 'bg-red-500'}`} />
                      <span className={`text-sm font-medium capitalize ${isOk(check.status) ? 'text-accent' : 'text-red-500'}`}>{check.status}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="rounded-lg bg-surface-secondary/50 p-3">
                  <p className="text-xs text-text-secondary">Message</p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">{check.message || 'All systems operational'}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><HardDrive className="h-5 w-5 text-text-tertiary" /> Health Summary</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${health?.status === 'ok' ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
              {health?.status === 'ok' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span className="font-semibold">{health?.status === 'ok' ? 'All Systems Operational' : 'Some Systems Degraded'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
