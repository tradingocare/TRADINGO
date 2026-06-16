import { cn } from '@/lib/utils';
import { type ProductDetailSpec } from '@/types/product-detail';

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
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([group, specs]) => (
        <div key={group}>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary dark:text-dark-text-tertiary">
            {group}
          </h4>
          <div className="overflow-hidden rounded-xl border border-border dark:border-dark-border">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, idx) => (
                  <tr
                    key={spec.id}
                    className={cn(
                      idx % 2 === 0
                        ? 'bg-surface dark:bg-dark-surface'
                        : 'bg-surface-secondary/50 dark:bg-dark-surface-secondary/50',
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-text-secondary dark:text-dark-text-secondary w-2/5">
                      {spec.key}
                    </td>
                    <td className="px-4 py-3 text-text-primary dark:text-dark-text-primary">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
