'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_STEPS = [
  { id: 'account', label: 'Create Account', description: 'Set up your buyer account' },
  { id: 'profile', label: 'Complete Profile', description: 'Add your company details and preferences' },
  { id: 'marketplace', label: 'Browse Marketplace', description: 'Explore products and suppliers' },
  { id: 'first-order', label: 'Place First Order', description: 'Create an RFQ or purchase directly' },
];

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const currentStep = 1;

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Welcome to TRADINGO</h1>
          <p className="text-text-secondary">Let&apos;s get you started as a buyer</p>
        </div>

        <div className="bg-surface rounded-xl p-6 space-y-4">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>Progress</span>
            <span>{currentStep} of {ONBOARDING_STEPS.length}</span>
          </div>
          <div className="h-2 bg-bg-base rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={step.id} className={`bg-surface rounded-xl p-4 flex items-start gap-3 ${isCurrent ? 'ring-1 ring-accent' : ''}`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 shrink-0" />
                ) : isCurrent ? (
                  <Circle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-text-tertiary mt-0.5 shrink-0" />
                )}
                <div>
                  <h3 className={`font-medium ${isCompleted ? 'text-text-tertiary' : 'text-text-primary'}`}>{step.label}</h3>
                  <p className="text-sm text-text-secondary">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button className="w-full" onClick={() => router.push('/buyer/dashboard')}>
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
