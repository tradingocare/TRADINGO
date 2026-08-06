'use client';

import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { RegistrationData } from '../types';
import type { StepErrors } from '../validation';
import { PLANS } from '../types';
import { MembershipComparison } from '../components/membership-comparison';

interface Props {
  data: RegistrationData;
  errors: StepErrors;
  onChange: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
}

export function Step6Membership({ data, errors, onChange }: Props) {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">Choose Your Plan</h3>
        <p className="mt-1 text-xs text-text-tertiary">Select the membership plan that fits your practice. No payment required at this stage.</p>
      </div>
      {errors.plan && <p className="text-xs text-red-400">{errors.plan}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const selected = data.plan === plan.value;
          return (
            <button
              key={plan.value}
              onClick={() => onChange('plan', plan.value)}
              className={`relative flex flex-col rounded-2xl border p-6 text-left transition-all duration-300 ${
                selected
                  ? 'border-accent/50 bg-accent/[0.06] shadow-lg shadow-accent/10'
                  : 'border-border bg-surface hover:border-border'
              }`}
            >
              {plan.value === 'company' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-accent to-[#fbbf24] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-text-primary shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              <div className={`flex items-center justify-between ${plan.value === 'company' ? 'mt-3' : ''}`}>
                <h4 className="text-base font-bold text-text-primary">{plan.title}</h4>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  selected ? 'border-accent bg-accent' : 'border-border'
                }`}>
                  {selected && <Check size={14} className="text-text-primary" />}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-text-primary">{plan.price}</span>
                <span className="text-xs text-text-tertiary">{plan.period}</span>
              </div>
              <span className="mt-1 inline-block rounded-full bg-surface px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
                + GST
              </span>
              <p className="mt-4 text-xs text-text-tertiary">{plan.description}</p>
              <ul className="mt-4 space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-xs text-text-secondary">{feat}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-6">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex w-full items-center justify-center gap-2 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {showComparison ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showComparison ? 'Hide comparison table' : 'Compare plans side by side'}
        </button>
        {showComparison && (
          <div className="mt-4">
            <MembershipComparison />
          </div>
        )}
      </div>
    </div>
  );
}
