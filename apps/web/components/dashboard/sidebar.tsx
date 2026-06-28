'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  CreditCard,
  Award,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Rocket,
  LifeBuoy,
  ClipboardList,
  AlertTriangle,
  Globe,
  Users,
  PlusCircle,
  Bell,
  Download,
  MessageSquare,
  Handshake,
  FileCheck,
  Truck,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_SELLER_NAV, DASHBOARD_BUYER_NAV, DASHBOARD_ADMIN_NAV } from '@/data/master-data';

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

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Package, FileText, ShoppingCart, BarChart3, Trophy: Award, Wallet: CreditCard,
  Star: Award, Headphones: LifeBuoy, Settings, Heart: Award, Store: Package, Scale: ClipboardList,
  Users, Grid3X3: ClipboardList, Shield: Award, AlertTriangle, ScrollText: FileText, Activity: Zap,
  Flask: Rocket, PlusCircle: Rocket, Globe, Bell, Download, MessageSquare, Handshake, FileCheck, Truck, PackageCheck,
};

export const sellerNavItems: SidebarItem[] = DASHBOARD_SELLER_NAV.map(i => ({ label: i.label, href: i.href, icon: ICON_MAP[i.icon] || LayoutDashboard, badge: i.badge ? Number(i.badge) : undefined }));

export const buyerNavItems: SidebarItem[] = DASHBOARD_BUYER_NAV.map(i => ({ label: i.label, href: i.href, icon: ICON_MAP[i.icon] || LayoutDashboard }));

export const adminNavItems: SidebarItem[] = DASHBOARD_ADMIN_NAV.map(i => ({ label: i.label, href: i.href, icon: ICON_MAP[i.icon] || LayoutDashboard, badge: i.badge ? Number(i.badge) : undefined }));
