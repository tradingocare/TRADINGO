'use client';

import { Check, X } from 'lucide-react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { PLANS, PLAN_FEATURES_COMPARISON } from '../types';

export function MembershipComparison() {
  return (
    <Table>
      <THead>
        <TR>
          <TH className="text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Feature</TH>
          {PLANS.map((plan) => (
            <TH key={plan.value} className={`text-center text-xs font-bold text-text-primary ${plan.value === 'company' ? 'bg-accent/[0.04]' : ''}`}>
              {plan.title}
              <div className="mt-0.5 text-[10px] font-normal text-text-tertiary">{plan.price}{plan.period}</div>
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {PLAN_FEATURES_COMPARISON.map((row) => (
          <TR key={row.feature}>
            <TD className="text-xs text-text-secondary">{row.feature}</TD>
            <TD className={`text-center ${row.individual ? 'text-accent' : 'text-text-tertiary/50'}`}>
              {row.individual ? <Check size={16} className="mx-auto" /> : <X size={16} className="mx-auto" />}
            </TD>
            <TD className={`text-center bg-accent/[0.02] ${row.company ? 'text-accent' : 'text-text-tertiary/50'}`}>
              {row.company ? <Check size={16} className="mx-auto" /> : <X size={16} className="mx-auto" />}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
