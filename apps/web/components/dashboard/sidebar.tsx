'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Package,
  FileText,
  Quote,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Award,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Rocket,
  LifeBuoy,
  Upload,
  Radio,
  ClipboardList,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  className?: string;
}

export function Sidebar({ items, title, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-border bg-surface transition-all duration-300 dark:bg-dark-surface dark:border-dark-border',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-dark-border">
        {!collapsed && title && (
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary dark:text-dark-text-tertiary">
            {title}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary dark:hover:text-dark-text-primary',
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export const sellerNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/seller/profile', icon: User },
  { label: 'Products', href: '/seller/products', icon: Package, badge: 12 },
  { label: 'RFQs', href: '/seller/rfqs', icon: FileText, badge: 5 },
  { label: 'Quotes', href: '/seller/quotes', icon: Quote },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingCart, badge: 3 },
  { label: 'Payments', href: '/seller/payments', icon: CreditCard },
  { label: 'Chat', href: '/seller/chat', icon: MessageSquare, badge: 2 },
  { label: 'GOCASH', href: '/seller/gocash', icon: Award },
  { label: 'TRADGO', href: '/seller/tradgo', icon: Zap },
  { label: 'Analytics', href: '/seller/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/seller/settings', icon: Settings },
  { label: 'Beta Program', href: '/seller/beta', icon: Rocket },
  { label: 'Product Import', href: '/seller/beta/product-import', icon: Upload },
  { label: 'RFQ Setup', href: '/seller/beta/rfq-onboarding', icon: Radio },
  { label: 'Support', href: '/seller/beta/support', icon: LifeBuoy },
];

export const buyerNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
  { label: 'My RFQs', href: '/buyer/rfqs', icon: FileText },
  { label: 'Quotes', href: '/buyer/quotes', icon: Quote, badge: 4 },
  { label: 'Orders', href: '/buyer/orders', icon: ShoppingCart, badge: 2 },
  { label: 'Payments', href: '/buyer/payments', icon: CreditCard },
  { label: 'Chat', href: '/buyer/chat', icon: MessageSquare },
  { label: 'GOCASH', href: '/buyer/gocash', icon: Award },
  { label: 'Settings', href: '/buyer/settings', icon: Settings },
];

export const adminNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: User },
  { label: 'Companies', href: '/admin/companies', icon: Package },
  { label: 'KYC Reviews', href: '/admin/kyc', icon: FileText, badge: 8 },
  { label: 'RFQs', href: '/admin/rfqs', icon: Quote, badge: 5 },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Disputes', href: '/admin/disputes', icon: MessageSquare, badge: 3 },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Beta Program', href: '/admin/beta', icon: Rocket },
  { label: 'Invites', href: '/admin/beta/invites', icon: User },
  { label: 'Launch Dashboard', href: '/admin/launch', icon: Rocket },
  { label: 'Go-Live Checklist', href: '/admin/launch/checklist', icon: ClipboardList },
  { label: 'Incidents', href: '/admin/launch/incidents', icon: AlertTriangle },
];
