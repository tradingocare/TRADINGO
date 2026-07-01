'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw, Search } from 'lucide-react';

interface FilterValues {
  direction: string;
  type: string;
  from: string;
  to: string;
  search: string;
}

interface WalletTransactionFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

const TRANSACTION_TYPES = [
  'ORDER_REWARD', 'REFERRAL_REWARD', 'CAMPAIGN_REWARD',
  'MEMBERSHIP_REWARD', 'GOCASH_PURCHASE', 'GOCASH_REDEEM',
  'MANUAL_CREDIT', 'MANUAL_DEBIT', 'REVERSAL', 'ADJUSTMENT',
  'SIGNUP_BONUS', 'LOYALTY_BONUS',
];

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'This month', days: 0 },
];

function toLocalDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export function WalletTransactionFilters({ filters, onChange, onApply, onReset }: WalletTransactionFiltersProps) {
  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    else from.setDate(1);
    onChange({ ...filters, from: toLocalDateString(from), to: toLocalDateString(to) });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">Search</label>
        <Input
          className="h-9 w-44 text-xs"
          placeholder="Search by reason..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">Direction</label>
        <select
          className="h-9 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-white backdrop-blur-xl"
          value={filters.direction}
          onChange={(e) => onChange({ ...filters, direction: e.target.value })}
        >
          <option value="">All</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">Type</label>
        <select
          className="h-9 max-w-[160px] rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-white backdrop-blur-xl"
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">From</label>
        <Input
          type="date"
          className="h-9 w-36 text-xs"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">To</label>
        <Input
          type="date"
          className="h-9 w-36 text-xs"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
        />
      </div>
      <Button variant="outline" size="sm" onClick={onApply}>
        <Filter className="mr-1 h-3 w-3" /> Apply
      </Button>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="mr-1 h-3 w-3" /> Reset
      </Button>
      <div className="flex items-center gap-1">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.days)}
            className="rounded-md border border-white/[0.06] px-2 py-1 text-[10px] text-white/50 hover:border-white/20 hover:text-white/80 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
