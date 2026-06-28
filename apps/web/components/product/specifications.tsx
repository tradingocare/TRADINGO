import { cn } from '@/lib/utils';
import { type ProductDetailSpec } from '@/types/product-detail';

const GLASS = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.09)';

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
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/30">{group}</h4>
          <div className="overflow-hidden rounded-2xl" style={{ border: BORDER }}>
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, idx) => (
                  <tr key={spec.id} style={{ background: idx % 2 === 0 ? GLASS : 'rgba(255,255,255,0.02)' }}>
                    <td className="px-4 py-3 font-semibold text-white/50 w-2/5">{spec.key}</td>
                    <td className="px-4 py-3 text-white/80">{spec.value}</td>
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
