'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRfqGuide } from '@/lib/api/beta';
import { CheckCircle, Circle, FileText, ArrowRight } from 'lucide-react';

interface GuideStep {
  label: string;
  completed: boolean;
  action: string;
}

export default function RfqOnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<{ status: string; steps: GuideStep[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuide = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRfqGuide();
      setData(result);
    } catch {
      setError('Failed to load RFQ guide');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Onboarding Guide" description="Set up your RFQ configuration" />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-text-secondary dark:text-dark-text-secondary">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              Loading RFQ guide...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="RFQ Onboarding Guide" description="Set up your RFQ configuration" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">{error}</p>
            <Button onClick={fetchGuide}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = data?.steps ?? [];
  const status = data?.status ?? 'unknown';
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  const handleAction = (action: string) => {
    router.push(action);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="RFQ Onboarding Guide"
        description="Set up your RFQ configuration"
        actions={
          <Button onClick={() => router.push('/seller/rfqs/new')}>
            <FileText className="mr-2 h-4 w-4" />
            Create RFQ
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            RFQ Setup Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center justify-between rounded-lg bg-surface-secondary p-4 dark:bg-dark-surface-secondary">
            <div>
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Current Status
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary capitalize">{status}</p>
            </div>
            <Badge variant={allDone ? 'success' : 'default'}>
              {completedCount} of {totalCount} steps done
            </Badge>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  step.completed
                    ? 'border-accent-500/30 bg-accent-50/30 dark:border-accent-500/20 dark:bg-accent-900/10'
                    : 'border-border dark:border-dark-border'
                }`}
              >
                <div className="flex shrink-0 items-start pt-0.5">
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6 text-accent-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-text-tertiary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      step.completed
                        ? 'text-accent-700 dark:text-accent-400'
                        : 'text-text-primary dark:text-dark-text-primary'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                <Button
                  variant={step.completed ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleAction(step.action)}
                >
                  {step.completed ? 'View' : 'Go'}
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {allDone && (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-accent-500/30 bg-accent-50/30 p-6 text-center dark:border-accent-500/20 dark:bg-accent-900/10">
              <CheckCircle className="mb-2 h-10 w-10 text-accent-500" />
              <p className="font-medium text-accent-700 dark:text-accent-400">
                RFQ setup complete!
              </p>
              <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                You're ready to receive and respond to RFQs from buyers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
