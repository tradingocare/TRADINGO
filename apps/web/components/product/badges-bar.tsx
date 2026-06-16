import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Wallet, Truck, ShieldCheck, PackageSearch, Globe, MapPin } from 'lucide-react';

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

export function BadgesBar({ product, className }: BadgesBarProps) {
  const badges: { label: string; icon: React.ReactNode; show: boolean; variant?: 'default' | 'success' | 'warning' | 'secondary' }[] = [
    {
      label: 'GOCASH Eligible',
      icon: <Wallet className="mr-1 h-3.5 w-3.5" />,
      show: !!product.goCashEligible,
      variant: 'default',
    },
    {
      label: 'TRADGO Shipping',
      icon: <Truck className="mr-1 h-3.5 w-3.5" />,
      show: !!product.tradgoEligible,
      variant: 'success',
    },
    {
      label: 'Escrow Protection',
      icon: <ShieldCheck className="mr-1 h-3.5 w-3.5" />,
      show: !!product.escrowEligible,
      variant: 'warning',
    },
    {
      label: 'Sample Order',
      icon: <PackageSearch className="mr-1 h-3.5 w-3.5" />,
      show: !!product.isSampleOrder,
      variant: 'secondary',
    },
    {
      label: 'Export Supported',
      icon: <Globe className="mr-1 h-3.5 w-3.5" />,
      show: !!product.exportSupported,
      variant: 'secondary',
    },
    {
      label: 'Near Me → Far™',
      icon: <MapPin className="mr-1 h-3.5 w-3.5" />,
      show: !!(product.latitude != null && product.longitude != null),
      variant: 'secondary',
    },
  ];

  const visible = badges.filter((b) => b.show);
  if (visible.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visible.map((badge) => (
        <Badge key={badge.label} variant={badge.variant}>
          {badge.icon}
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
