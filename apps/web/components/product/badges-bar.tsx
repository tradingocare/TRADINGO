import { cn } from '@/lib/utils';
import { Wallet, Truck, ShieldCheck, PackageSearch, Globe, MapPin } from 'lucide-react';
import { PRODUCT_BADGES } from '@/data/master-data';

interface BadgesBarProduct {
  goCashEligible?: boolean;
  tradgoEligible?: boolean;
  escrowEligible?: boolean;
  isSampleOrder?: boolean;
  exportSupported?: boolean;
  latitude?: number;
  longitude?: number;
}

interface BadgesBarProps {
  product: BadgesBarProduct;
  className?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Wallet: <Wallet size={11} />,
  Truck: <Truck size={11} />,
  ShieldCheck: <ShieldCheck size={11} />,
  PackageSearch: <PackageSearch size={11} />,
  Globe: <Globe size={11} />,
  MapPin: <MapPin size={11} />,
};

const SHOW_MAP: Record<string, (product: BadgesBarProduct) => boolean> = {
  goCashEligible: (p) => !!p.goCashEligible,
  tradgoEligible: (p) => !!p.tradgoEligible,
  escrowEligible: (p) => !!p.escrowEligible,
  isSampleOrder: (p) => !!p.isSampleOrder,
  exportSupported: (p) => !!p.exportSupported,
  nearMe: (p) => !!(p.latitude != null && p.longitude != null),
};

const BADGE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#4ade80' },
  warning: { bg: 'rgba(242,201,76,0.12)', border: 'rgba(242,201,76,0.3)', color: '#F2C94C' },
  accent:  { bg: 'rgba(255,77,0,0.12)', border: 'rgba(255,77,0,0.3)', color: '#FF4D00' },
  default: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' },
};

export function BadgesBar({ product, className }: BadgesBarProps) {
  const badges = PRODUCT_BADGES.map((b) => ({
    label: b.label,
    icon: ICON_MAP[b.icon] || null,
    show: SHOW_MAP[b.key]?.(product) ?? false,
    variant: b.variant as string,
  }));

  const visible = badges.filter((b) => b.show);
  if (visible.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visible.map((badge) => {
        const style = BADGE_STYLES[badge.variant] || BADGE_STYLES.default;
        return (
          <span
            key={badge.label}
            className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
              backdropFilter: 'blur(8px)',
            }}
          >
            {badge.icon}
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
