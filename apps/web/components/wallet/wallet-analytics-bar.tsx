'use client';

interface AnalyticsBarItem {
  label: string;
  value: number;
  total: number;
  color?: string;
  count?: number;
}

interface WalletAnalyticsBarProps {
  items: AnalyticsBarItem[];
  formatCurrency: (amount: number) => string;
  maxItems?: number;
}

const DEFAULT_COLORS = [
  'from-orange-500 to-orange-400',
  'from-blue-500 to-blue-400',
  'from-green-500 to-green-400',
  'from-purple-500 to-purple-400',
  'from-pink-500 to-pink-400',
  'from-teal-500 to-teal-400',
  'from-amber-500 to-amber-400',
  'from-cyan-500 to-cyan-400',
];

export function WalletAnalyticsBar({ items, formatCurrency, maxItems = 8 }: WalletAnalyticsBarProps) {
  if (!items?.length) {
    return <p className="py-4 text-center text-sm text-white/40">No data available</p>;
  }

  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const display = items.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {display.map((item, idx) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-white/80">{item.label}</span>
              <span className="font-medium text-white">
                {formatCurrency(item.value)}
                {item.count != null && (
                  <span className="ml-1 text-xs text-white/40">({item.count})</span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} transition-all duration-500`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
