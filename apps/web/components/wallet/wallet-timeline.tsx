'use client';

import { ArrowUpRight, ArrowDownLeft, Award } from 'lucide-react';

interface TimelineEntry {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface WalletTimelineProps {
  entries: TimelineEntry[];
  formatCurrency: (amount: number) => string;
}

export function WalletTimeline({ entries, formatCurrency }: WalletTimelineProps) {
  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Award className="mb-2 h-8 w-8 text-white/20" />
        <p className="text-sm text-white/40">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {entries.slice(0, 10).map((entry, idx) => (
        <div key={entry.id} className="relative flex gap-4 pb-4">
          {idx < Math.min(entries.length, 10) - 1 && (
            <div className="absolute left-[11px] top-6 h-full w-px bg-white/[0.06]" />
          )}
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            entry.direction === 'CREDIT'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {entry.direction === 'CREDIT'
              ? <ArrowUpRight className="h-3 w-3" />
              : <ArrowDownLeft className="h-3 w-3" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{entry.type.replace(/_/g, ' ')}</span>
              <span className={`text-sm font-semibold ${
                entry.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'
              }`}>
                {entry.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-white/40">{entry.reason}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[10px] text-white/30">{new Date(entry.createdAt).toLocaleDateString()}</span>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                entry.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                entry.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                entry.status === 'REVERSED' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-white/5 text-white/40'
              }`}>{entry.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
