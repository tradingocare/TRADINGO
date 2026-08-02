import { CheckCircle2 } from 'lucide-react';
import type { ProductDetailSpec } from '@/types/product-detail';

interface SpecificationsProps {
  specifications: ProductDetailSpec[];
}

function parseGroupedSpecs(specs: ProductDetailSpec[]): Map<string, ProductDetailSpec[]> {
  const groups = new Map<string, ProductDetailSpec[]>();
  for (const spec of specs) {
    const colonIdx = spec.key.indexOf(': ');
    const group = colonIdx > 0 ? spec.key.slice(0, colonIdx) : 'General';
    const key = colonIdx > 0 ? spec.key.slice(colonIdx + 2) : spec.key;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ ...spec, key });
  }
  return groups;
}

export function Specifications({ specifications }: SpecificationsProps) {
  if (!specifications || specifications.length === 0) return null;

  const grouped = parseGroupedSpecs(specifications);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([group, specs]) => (
        <div key={group} className="rounded-xl border border-border bg-bg-elevated/70 p-3">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-accent" />
            <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-text-tertiary">{group}</h4>
          </div>
          <div className="space-y-2">
            {specs.map((spec) => (
              <div
                key={spec.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-xs text-text-secondary">{spec.key}</span>
                <span className="text-sm font-semibold text-text-primary text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
