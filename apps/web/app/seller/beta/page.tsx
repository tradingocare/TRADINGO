'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getBetaDashboard,
  getOnboardingStatus,
  getBetaFeedbackStats,
  advanceOnboardingStep,
  type BetaDashboard,
  type OnboardingStatus,
} from '@/lib/api/beta';
import {
  Rocket,
  Package,
  FileText,
  LifeBuoy,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';

const STEP_LABELS: Record<string, string> = {
  INVITE_ACCEPTED: 'Invite Accepted',
  PROFILE_SETUP: 'Profile Setup',
  PRODUCT_IMPORT: 'Product Import',
  RFQ_SETUP: 'RFQ Setup',
  GO_LIVE: 'Go Live',
  COMPLETED: 'Completed',
};

const TICKET_PRIORITY_VARIANTS: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  URGENT: 'destructive',
  HIGH: 'warning',
  MEDIUM: 'default',
  LOW: 'secondary',
};

function formatStepName(step: string): string {
  return STEP_LABELS[step] || step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMetric(metrics: { name: string; value: number }[], name: string): number {
  return metrics.find((m) => m.name === name)?.value ?? 0;
}

export default function BetaProgramPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<BetaDashboard | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [npsAverage, setNpsAverage] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, onboardingData, feedbackStats] = await Promise.all([
        getBetaDashboard(),
        getOnboardingStatus(),
        getBetaFeedbackStats(),
      ]);
      setDashboard(dashData);
      setOnboarding(onboardingData);
      setNpsAverage(feedbackStats.npsAverage);
    } catch {
      setError('Failed to load beta dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdvanceStep = async () => {
    setAdvancing(true);
    try {
      await advanceOnboardingStep();
      await fetchData();
    } catch {
      // silently fail
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Beta Program" description="Your onboarding progress and program metrics" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
            <p className="text-lg font-medium text-text-primary dark:text-dark-text-primary">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onboardingProgress = dashboard?.onboarding;
  const stepName = onboardingProgress?.currentStep ?? onboarding?.onboardingStep ?? 'INVITE_ACCEPTED';
  const progress = onboardingProgress?.progress ?? onboarding?.setupProgress ?? 0;
  const metrics = dashboard?.metrics ?? [];
  const productsImported = getMetric(metrics, 'products_imported');
  const rfqsCreated = getMetric(metrics, 'rfqs_created');
  const ticketsCount = getMetric(metrics, 'support_tickets');
  const errors = dashboard?.recentErrors ?? [];
  const tickets = dashboard?.recentTickets ?? [];
  const npsDisplay = npsAverage != null ? String(npsAverage) : 'N/A';
  const npsColor =
    npsAverage != null
      ? npsAverage >= 50
        ? 'text-accent-500'
        : npsAverage >= 30
          ? 'text-amber-500'
          : 'text-red-500'
      : 'text-text-secondary dark:text-dark-text-secondary';

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Beta Program" description="Your onboarding progress and program metrics" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary-500" />
            Onboarding Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Current Step</span>
              <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                {formatStepName(stepName)}
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Progress</span>
                <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {progress < 100 ? (
                <Button onClick={handleAdvanceStep} disabled={advancing}>
                  {advancing ? 'Advancing...' : 'Continue Onboarding'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Onboarding Complete
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Products Imported" value={String(productsImported)} />
        <StatCard icon={FileText} label="RFQs Created" value={String(rfqsCreated)} />
        <StatCard icon={LifeBuoy} label="Support Tickets" value={String(ticketsCount)} />
        <div
          className={cn(
            'rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-surface dark:border-dark-border',
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className={cn('mt-4 text-2xl font-bold', npsColor)}>{npsDisplay}</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">NPS Score</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleAdvanceStep} disabled={advancing || progress >= 100}>
              <Rocket className="mr-2 h-4 w-4" />
              Continue Onboarding
            </Button>
            <Button variant="outline" onClick={() => router.push('/seller/support')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              New Support Ticket
            </Button>
            <Button variant="outline" onClick={() => router.push('/seller/products/import')}>
              <Package className="mr-2 h-4 w-4" />
              Import Products
            </Button>
            <Button variant="outline" onClick={() => router.push('/seller/rfqs/new')}>
              <FileText className="mr-2 h-4 w-4" />
              Setup RFQ
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-accent-500" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No recent errors</p>
              </div>
            ) : (
              <div className="space-y-3">
                {errors.slice(0, 5).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                        {e.errorType}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        {e.errorMessage}
                      </p>
                      {e.page && (
                        <p className="mt-0.5 text-xs text-text-tertiary">Page: {e.page}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-text-tertiary">
                      {new Date(e.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-500" />
              Recent Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-accent-500" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No support tickets</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((t) => {
                  const StatusIcon = t.status === 'RESOLVED' || t.status === 'CLOSED'
                    ? CheckCircle
                    : Clock;
                  const priorityVariant = TICKET_PRIORITY_VARIANTS[t.priority] || 'secondary';
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50"
                    >
                      <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                          {t.subject}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                          {t.description.length > 80
                            ? `${t.description.slice(0, 80)}...`
                            : t.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={priorityVariant}>{t.priority}</Badge>
                        <span className="text-xs text-text-tertiary">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
