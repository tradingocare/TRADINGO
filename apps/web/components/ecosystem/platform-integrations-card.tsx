'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShoppingBag, Zap, Users, BarChart3, Star, Gift, Sparkles, Target, MessageSquare, DollarSign, Truck, Coins, TrendingUp, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface IntegrationLink {
  label: string;
  href: string;
  icon: LucideIcon;
  xp?: string;
  gocash?: string;
  value?: string;
  color?: string;
}

interface PlatformIntegrationsCardProps {
  links: IntegrationLink[];
  title?: string;
}

export function PlatformIntegrationsCard({ links, title = 'Platform Integrations' }: PlatformIntegrationsCardProps) {
  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-accent-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link key={i} href={link.href} className="group flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 transition hover:border-border hover:bg-surface">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface ${link.color ?? ''}`}>
                <Icon className="h-4 w-4 text-text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary group-hover:text-primary">{link.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {link.xp && <Badge variant="outline" className="border-accent-500/20 text-[10px] text-accent-500">+{link.xp} XP</Badge>}
                  {link.gocash && <Badge variant="outline" className="border-status-success/20 text-[10px] text-status-success">+{link.gocash} GOCASH</Badge>}
                  {link.value && <Badge variant="outline" className="border-accent/20 text-[10px] text-accent">{link.value}</Badge>}
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Pre-configured integration sets
export const BUYER_INTEGRATIONS: IntegrationLink[] = [
  { label: 'AI Workspace', href: '/buyer/ai-workspace', icon: Sparkles, xp: '50', gocash: '10', value: 'AI Tools' },
  { label: 'Marketplace', href: '/buyer/marketplace', icon: ShoppingBag, xp: '100', gocash: '25', value: 'Source Products' },
  { label: 'RFQs', href: '/buyer/rfqs', icon: Target, xp: '75', gocash: '15', value: 'Request Quotes' },
  { label: 'Orders', href: '/buyer/orders', icon: Truck, xp: '150', gocash: '50', value: 'Track Orders' },
  { label: 'Campaigns', href: '/buyer/campaigns', icon: Gift, xp: '25', gocash: '5', value: 'Earn Rewards' },
  { label: 'Referrals', href: '/buyer/referrals', icon: Users, xp: '200', gocash: '100', value: 'Invite Friends' },
  { label: 'Analytics', href: '/buyer/analytics', icon: BarChart3, xp: '30', gocash: '5', value: 'Insights' },
  { label: 'GOCASH Wallet', href: '/buyer/gocash', icon: Coins, xp: '10', gocash: '—', value: 'Manage Funds' },
];

export const SELLER_INTEGRATIONS: IntegrationLink[] = [
  { label: 'AI Workspace', href: '/seller/ai-workspace', icon: Sparkles, value: 'AI Tools', xp: '50' },
  { label: 'Marketplace', href: '/seller/products', icon: ShoppingBag, value: 'List Products', xp: '100' },
  { label: 'Advertising', href: '/seller/advertising', icon: TrendingUp, value: 'Promote', xp: '75' },
  { label: 'CRM', href: '/seller/crm', icon: MessageSquare, value: 'Manage Leads', xp: '60' },
  { label: 'Quotes', href: '/seller/quotes', icon: Target, value: 'Respond', xp: '80' },
  { label: 'Orders', href: '/seller/orders', icon: Truck, value: 'Fulfill Orders', xp: '150' },
  { label: 'Campaigns', href: '/seller/campaigns', icon: Gift, value: 'Create Promos', xp: '40' },
  { label: 'Referrals', href: '/seller/referrals', icon: Users, value: 'Refer Sellers', xp: '200' },
  { label: 'Analytics', href: '/seller/analytics', icon: BarChart3, value: 'Dashboard', xp: '30' },
  { label: 'Finance', href: '/seller/finance', icon: DollarSign, value: 'Payouts', xp: '50' },
  { label: 'TradeServ', href: '/seller/tradeserv', icon: Award, value: 'B2B Services', xp: '100' },
  { label: 'GOCASH Wallet', href: '/seller/gocash', icon: Coins, value: 'Manage Funds', xp: '10' },
];
