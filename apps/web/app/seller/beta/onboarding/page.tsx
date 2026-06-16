'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOnboardingStatus, advanceOnboardingStep } from '@/lib/api/beta';
import type { OnboardingStatus, OnboardingProgress } from '@/lib/api/beta';
import { CheckCircle, Circle, ArrowRight, Rocket } from 'lucide-react';

interface StepDef {
  key: string;
  label: string;
  description: string;
}

const STEPS: StepDef[] = [
  { key: 'INVITE_ACCEPTED', label: 'Welcome', description: "You've joined the beta program" },
  { key: 'PROFILE_SETUP', label: 'Profile Setup', description: 'Complete your company profile' },
  { key: 'COMPANY_VERIFICATION', label: 'Verification', description: 'Verify your business details' },
  { key: 'PRODUCT_SETUP', label: 'Products', description: 'Add your first products' },
  { key: 'RFQ_CONFIGURATION', label: 'RFQ Setup', description: 'Configure RFQ preferences' },
  { key: 'TEAM_INVITES', label: 'Team', description: 'Invite team members' },
  { key: 'INTEGRATION_SETUP', label: 'Integration', description: 'Set up integrations' },
  { key: 'GO_LIVE', label: 'Go Live', description: 'Launch your storefront' },
  { key: 'ONBOARDING_COMPLETE', label: 'Complete', description: 'Onboarding finished!' },
];

function findStepIndex(stepKey: string): number {
  return STEPS.findIndex((s) => s.key === stepKey);
}

export default function BetaOnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOnboardingStatus();
      setStatus(data);
    } catch {
      setError('Failed to load onboarding status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const result: OnboardingProgress = await advanceOnboardingStep();
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              onboardingStep: result.currentStep,
              setupProgress: result.progress,
              onboardingCompletedAt:
                result.currentStep === 'ONBOARDING_COMPLETE' ? new Date().toISOString() : prev.onboardingCompletedAt,
            }
          : prev,
      );
    } catch {
      await fetchStatus();
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Onboarding Wizard" description="Guided setup for your TRADINGO beta program" />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-text-secondary dark:text-dark-text-secondary">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              Loading onboarding status...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Onboarding Wizard" description="Guided setup for your TRADINGO beta program" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">{error}</p>
            <Button onClick={fetchStatus}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepKey = status?.onboardingStep ?? 'INVITE_ACCEPTED';
  const isComplete = status?.onboardingCompletedAt != null || currentStepKey === 'ONBOARDING_COMPLETE';
  const currentIndex = findStepIndex(currentStepKey);
  const progress = status?.setupProgress ?? Math.round((currentIndex / (STEPS.length - 1)) * 100);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Onboarding Wizard"
        description="Guided setup for your TRADINGO beta program"
        actions={
          isComplete ? (
            <Button onClick={() => router.push('/seller/dashboard')}>
              <Rocket className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary-500" />
            Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
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

          {isComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="mb-4 h-16 w-16 text-accent-500" />
              <h3 className="mb-2 text-xl font-bold text-text-primary dark:text-dark-text-primary">
                Onboarding Complete!
              </h3>
              <p className="mb-6 max-w-md text-text-secondary dark:text-dark-text-secondary">
                You've completed all onboarding steps. Your storefront is ready to go live. Start exploring your dashboard
                to manage products, respond to RFQs, and grow your business.
              </p>
              <Button size="lg" onClick={() => router.push('/seller/dashboard')}>
                <Rocket className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                {STEPS.map((step, index) => {
                  const isStepCompleted = index < currentIndex || (isComplete && index < STEPS.length);
                  const isCurrent = index === currentIndex;
                  const isPending = index > currentIndex && !isComplete;

                  return (
                    <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                      {index < STEPS.length - 1 && (
                        <div
                          className={`absolute left-[15px] top-8 w-px ${
                            isStepCompleted
                              ? 'bg-accent-500'
                              : 'bg-border dark:bg-dark-border'
                          }`}
                          style={{ height: 'calc(100% + 0.5rem)' }}
                        />
                      )}
                      <div className="relative z-10 flex shrink-0 items-start pt-0.5">
                        {isStepCompleted ? (
                          <CheckCircle className="h-7 w-7 text-accent-500" />
                        ) : isCurrent ? (
                          <Circle className="h-7 w-7 fill-primary-500 text-primary-500" />
                        ) : (
                          <Circle className="h-7 w-7 text-text-tertiary" />
                        )}
                      </div>
                      <div
                        className={`min-w-0 flex-1 rounded-lg border p-4 ${
                          isCurrent
                            ? 'border-primary-500 bg-primary-50/50 dark:border-primary-500 dark:bg-primary-900/10'
                            : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isStepCompleted
                                ? 'text-accent-700 dark:text-accent-400'
                                : isCurrent
                                  ? 'text-primary-700 dark:text-primary-400'
                                  : 'text-text-tertiary'
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-[10px]">
                              Current
                            </Badge>
                          )}
                          {isStepCompleted && !isCurrent && (
                            <Badge variant="success" className="text-[10px]">
                              Done
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-sm ${
                            isPending ? 'text-text-tertiary' : 'text-text-secondary dark:text-dark-text-secondary'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleAdvance} disabled={advancing} size="lg">
                  {advancing ? 'Advancing...' : 'Advance to Next Step'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
