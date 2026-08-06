import { BadgeCheck, ShieldCheck, Award, Crown, Star, Diamond, TrendingUp, ShoppingBag, Zap, Truck, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 'verified' | 'trusted' | 'premium' | 'gold' | 'platinum' | 'elite' | 'top-seller' | 'top-buyer' | 'fast-responder' | 'reliable-supplier' | 'future';

interface BadgeConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const BADGE_CONFIG: Record<BadgeType, BadgeConfig> = {
  verified:          { label: 'Verified',          icon: BadgeCheck,    className: 'text-green-500 bg-green-500/10 border-green-500/20' },
  trusted:           { label: 'Trusted',           icon: ShieldCheck,   className: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  premium:           { label: 'Premium',           icon: Award,         className: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  gold:              { label: 'Gold',              icon: Crown,         className: 'text-accent bg-accent/10 border-accent/20' },
  platinum:          { label: 'Platinum',          icon: Diamond,       className: 'text-accent bg-accent/10 border-accent/20' },
  elite:             { label: 'Elite',             icon: Star,          className: 'text-accent bg-accent/10 border-accent/20' },
  'top-seller':      { label: 'Top Seller',       icon: TrendingUp,    className: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  'top-buyer':       { label: 'Top Buyer',        icon: ShoppingBag,   className: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  'fast-responder':  { label: 'Fast Responder',   icon: Zap,           className: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
  'reliable-supplier': { label: 'Reliable Supplier', icon: Truck,      className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  future:            { label: 'Future',            icon: Sparkles,      className: 'text-gray-400 bg-surface border-border' },
};

interface VerifiedBadgeProps {
  type?: BadgeType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerifiedBadge({ type = 'verified', showLabel = true, size = 'sm', className }: VerifiedBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (!showLabel) {
    return <Icon className={cn(sizeClasses, config.className.split(' ')[0], className)} />;
  }

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', config.className, className)}>
      <Icon className={sizeClasses} />
      {config.label}
    </span>
  );
}
