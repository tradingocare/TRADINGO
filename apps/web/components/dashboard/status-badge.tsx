import { cn } from '@/lib/utils';

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/[ _]/g, '-');
}

const statusStyles: Record<string, string> = {
  active: 'border-accent-500/40 bg-accent-500/10 text-accent-400',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  completed: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-400',
  draft: 'border-white/10 bg-white/[0.04] text-white/50',
  verified: 'border-accent-500/40 bg-accent-500/10 text-accent-400',
  rejected: 'border-red-500/40 bg-red-500/10 text-red-400',
  approved: 'border-accent-500/40 bg-accent-500/10 text-accent-400',
  submitted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  open: 'border-green-500/40 bg-green-500/10 text-green-400',
  disputed: 'border-red-500/40 bg-red-500/10 text-red-400',
  resolved: 'border-accent-500/40 bg-accent-500/10 text-accent-400',
  bug: 'border-red-500/40 bg-red-500/10 text-red-400',
  feature: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  nps: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  general: 'border-white/10 bg-white/[0.04] text-white/50',
  'negotiation-started': 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  'buyer-counter': 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  'seller-counter': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  converted: 'border-green-500/40 bg-green-500/10 text-green-400',
  'buyer-confirmed': 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  'seller-pending': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  'seller-accepted': 'border-green-500/40 bg-green-500/10 text-green-400',
  locked: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  'converted-to-order': 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  packed: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
  'ready-for-dispatch': 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  'in-transit': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  preparing: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  'ready-for-pickup': 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  'courier-assigned': 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  dispatched: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  'out-for-delivery': 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  delivered: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  'delivery-confirmed': 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  'delivery-failed': 'border-red-500/40 bg-red-500/10 text-red-400',
  'partially-delivered': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  returned: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[normalizeStatus(status)] || 'border-white/10 bg-white/[0.04] text-white/50';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize backdrop-blur-md',
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}
