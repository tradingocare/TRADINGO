'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBetaFeedbackStats, getBetaErrorStats, getUsageStats, getBetaInviteStats } from '@/lib/api/beta';
import { Rocket, Mail, CheckCircle, Clock, TrendingUp, AlertTriangle, BarChart3, RefreshCw, MessageSquare, Bug, Lightbulb, Star } from 'lucide-react';

interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
}

interface FeedbackStats {
  total: number;
  bugs: number;
  features: number;
  nps: number;
  npsAverage?: number | null;
}

interface ErrorStats {
  total: number;
  resolved: number;
  byType: Record<string, number>;
}

interface UsageStat {
  category: string;
  count: number;
}

export default function AdminBetaDashboardPage() {
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, fb, err, usage] = await Promise.all([
        getBetaInviteStats(),
        getBetaFeedbackStats(),
        getBetaErrorStats(),
        getUsageStats(),
      ]);
      setInviteStats(inv);
      setFeedbackStats(fb);
      setErrorStats(err);
      setUsageStats(usage);
    } catch {
      setError('Failed to load beta dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const npsDisplay = feedbackStats?.npsAverage != null ? String(feedbackStats.npsAverage) : 'N/A';

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Beta Program Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-secondary dark:bg-dark-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Beta Program Dashboard" />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{error}</p>
            <Button onClick={fetchAll} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Beta Program Dashboard"
        actions={
          <Button onClick={fetchAll} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Invites" value={String(inviteStats?.total ?? 0)} icon={Mail} />
        <StatCard label="Accepted" value={String(inviteStats?.accepted ?? 0)} icon={CheckCircle} />
        <StatCard label="Pending" value={String(inviteStats?.pending ?? 0)} icon={Clock} />
        <StatCard label="NPS Score" value={npsDisplay} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary dark:text-dark-text-secondary">Total Submissions</span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{feedbackStats?.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-text-secondary dark:text-dark-text-secondary">
                <Bug className="h-3.5 w-3.5 text-red-500" /> Bugs
              </span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{feedbackStats?.bugs ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-text-secondary dark:text-dark-text-secondary">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Features
              </span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{feedbackStats?.features ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-text-secondary dark:text-dark-text-secondary">
                <Star className="h-3.5 w-3.5 text-purple-500" /> NPS Responses
              </span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{feedbackStats?.nps ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary dark:text-dark-text-secondary">Total Errors</span>
              <span className="font-semibold text-text-primary dark:text-dark-text-primary">{errorStats?.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary dark:text-dark-text-secondary">Resolved</span>
              <span className="font-semibold text-accent-600 dark:text-accent-400">{errorStats?.resolved ?? 0}</span>
            </div>
            {errorStats?.byType && Object.keys(errorStats.byType).length > 0 && (
              <div className="pt-2 border-t border-border dark:border-dark-border">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">By Type</p>
                <div className="space-y-1.5">
                  {Object.entries(errorStats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary dark:text-dark-text-secondary">{type}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usageStats.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No usage data yet</p>
            ) : (
              <>
                {usageStats.slice(0, 5).map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary dark:text-dark-text-secondary capitalize">{stat.category.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-text-primary dark:text-dark-text-primary">{stat.count}</span>
                  </div>
                ))}
                {usageStats.length > 5 && (
                  <p className="text-xs text-text-tertiary text-center pt-1">+{usageStats.length - 5} more categories</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="h-5 w-5 text-primary-500" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/beta/invites">
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" /> Manage Invites
              </Button>
            </Link>
            <Link href="/admin/feedback">
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" /> View Feedback
              </Button>
            </Link>
            <Button variant="outline" size="sm" disabled>
              <AlertTriangle className="mr-2 h-4 w-4" /> View Errors
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
