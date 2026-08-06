import type { ElementType } from 'react';

export function StatBox({ icon: Icon, label, value, sub }: {
  icon?: ElementType; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4">
      {Icon && (
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-[#f59e0b]" />
        </div>
      )}
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-[10px] text-text-tertiary">{sub}</p>}
    </div>
  );
}
