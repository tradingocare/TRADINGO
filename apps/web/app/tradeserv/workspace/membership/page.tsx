'use client';

import { Award, Check, Loader2 } from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { useCurrentPlan, usePlans } from '@/hooks/use-membership';

export default function MembershipPage() {
  const { data: currentPlan, isLoading: planLoading } = useCurrentPlan();
  const { data: plans, isLoading: plansLoading } = usePlans();

  if (planLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  const subscriptionPlan = currentPlan?.subscriptionPlan || 'Free';
  const expiryDate = currentPlan?.subscriptionExpiresAt
    ? new Date(currentPlan.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Membership"
        description="Manage your subscription plan"
      />
      <div className="glass-card-xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <Award className="h-6 w-6 text-[#f59e0b]" />
          <div>
            <p className="text-lg font-bold text-text-primary">{subscriptionPlan}</p>
            {expiryDate && <p className="text-sm text-text-tertiary">Renewal: {expiryDate}</p>}
          </div>
          <StatusBadge status={currentPlan?.subscriptionStatus === 'ACTIVE' ? 'active' : 'pending'} />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {(plans || []).map((plan) => {
          const isCurrent = plan.name === subscriptionPlan || plan.planId === currentPlan?.currentPlanId;
          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 backdrop-blur-xl transition-all ${
                isCurrent
                  ? 'border-[#f59e0b]/50 bg-accent/5'
                  : 'border-border bg-surface'
              }`}
            >
              <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {plan.isFree ? 'Free' : `₹${plan.pricePlanA}/mo`}
              </p>
              <ul className="mt-4 space-y-2">
                {(plan.planFeatures || []).filter(f => f.included).map((f) => (
                  <li key={f.id} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f.feature}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="mt-6 rounded-full bg-surface-secondary px-4 py-2 text-center text-sm font-medium text-text-tertiary">
                  Current Plan
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-6 w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface"
                >
                  {plans && plans.indexOf(plan) > plans.findIndex(p => p.name === subscriptionPlan) ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
