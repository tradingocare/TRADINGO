'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLaunchDashboard, type LaunchDashboard } from '@/lib/api/launch';
import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Rocket,
  Building2,
  Package,
  Users,
  Search,
  Eye,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  ArrowUp,
  CheckCircle2,
  Activity,
} from 'lucide-react';

const severityConfig: Record<string, { variant: 'destructive' | 'warning' | 'default' | 'secondary' }> = {
  CRITICAL: { variant: 'destructive' },
  HIGH: { variant: 'warning' },
  MEDIUM: { variant: 'default' },
  LOW: { variant: 'secondary' },
};

const statusLabel: Record<string, string> = {
  DETECTED: 'Detected',
  INVESTIGATING: 'Investigating',
  IDENTIFIED: 'Identified',
  MONITORING: 'Monitoring',
  RESOLVED: 'Resolved',
};

export default function LaunchDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<LaunchDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLaunchDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load launch dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Launch Dashboard" description="Phase 7E public launch readiness" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Launch Dashboard" description="Phase 7E public launch readiness" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load launch dashboard</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completedItems = data.checklistProgress.completed + data.checklistProgress.verified;
  const totalItems = data.checklistProgress.total;
  const readinessPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Launch Dashboard" description="Phase 7E public launch readiness" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label="Total Companies" value={String(data.totalCompanies)} change="Registered" changeType="neutral" />
        <StatCard icon={CheckCircle2} label="Companies Onboarded" value={String(data.companiesOnboarded)} change="Ready" changeType="neutral" />
        <StatCard icon={Package} label="Total Products" value={String(data.totalProducts)} change="Listed" changeType="neutral" />
        <StatCard icon={Users} label="Active Users" value={String(data.activeUsers)} change="Active" changeType="neutral" />
        <StatCard icon={Search} label="Search Volume (30d)" value={String(data.searchVolume)} change="Searches" changeType="neutral" />
        <StatCard icon={Eye} label="Page Views (30d)" value={String(data.pageViews)} change="Views" changeType="neutral" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{data.conversionRate}%</div>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Overall conversion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{data.activeIncidents}</div>
            <Link href="/admin/launch/incidents" className="text-xs text-primary-600 hover:underline dark:text-primary-400">
              View incidents
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Checklist Progress</CardTitle>
            <ClipboardList className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
              {completedItems}/{totalItems}
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Items completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Readiness</CardTitle>
            <Rocket className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{readinessPercent}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
              <div
                className="h-2 rounded-full bg-accent-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentIncidents.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No recent incidents</p>
            ) : (
              data.recentIncidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityConfig[incident.severity]?.variant ?? 'secondary'}>
                        {incident.severity}
                      </Badge>
                      <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        {statusLabel[incident.status] ?? incident.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      {incident.title}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{formatDate(incident.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/launch/incidents"
              className="inline-flex items-center text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              View All Incidents
              <ArrowUp className="ml-1 h-3 w-3 rotate-45" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/admin/launch/checklist')}
            >
              <ClipboardList className="mr-2 h-4 w-4" /> View Checklist
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/admin/launch/metrics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" /> View Metrics
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/admin/launch/incidents/new')}
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Report Incident
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/admin/launch/status')}
            >
              <Activity className="mr-2 h-4 w-4" /> View Status Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
